import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditLoggerService } from '../../../common/services/audit-logger.service';
import { BusinessException, ValidationException } from '../../../common/exceptions';
import { IRequestContext } from '@gymspace/shared';
import { 
  SubscriptionPlan, 
  SubscriptionOrganization, 
  SubscriptionStatus,
  SubscriptionOperationType,
  CancellationReason,
  Prisma,
} from '@prisma/client';
import { ProrationCalculationService, ProrationCalculation } from './proration-calculation.service';
import { SubscriptionDateManagerService } from './subscription-date-manager.service';
import Decimal from 'decimal.js';

export interface SubscriptionTransitionResult {
  oldSubscription: SubscriptionOrganization;
  newSubscription: SubscriptionOrganization;
  operation: any; // SubscriptionOperation
  proration?: ProrationCalculation;
  effectiveDate: Date;
  success: boolean;
}

export interface CancellationResult {
  subscription: SubscriptionOrganization;
  cancellation: any; // SubscriptionCancellation
  refundAmount?: Decimal;
  effectiveDate: Date;
  success: boolean;
}

export interface UpgradeDowngradeOptions {
  newPlanId: string;
  effectiveDate?: Date;
  immediate?: boolean;
  prorationEnabled?: boolean;
}

export interface RenewalOptions {
  planId?: string; // If changing plan during renewal
  duration?: number;
  durationPeriod?: 'DAY' | 'MONTH';
  effectiveDate?: Date;
  extendCurrent?: boolean;
}

export interface CancellationOptions {
  reason: CancellationReason;
  reasonDescription?: string;
  effectiveDate?: Date;
  immediate?: boolean;
  refundEnabled?: boolean;
  retentionOffered?: boolean;
  retentionDetails?: string;
}

@Injectable()
export class SubscriptionTransitionService {
  private readonly logger = new Logger(SubscriptionTransitionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogger: AuditLoggerService,
    private readonly prorationService: ProrationCalculationService,
    private readonly dateManager: SubscriptionDateManagerService,
  ) {}

  /**
   * Execute subscription upgrade with transaction integrity
   */
  async upgradeSubscription(
    context: IRequestContext,
    organizationId: string,
    options: UpgradeDowngradeOptions,
  ): Promise<SubscriptionTransitionResult> {
    this.logger.log(`Upgrading subscription for organization ${organizationId}`);

    return await this.executeSubscriptionTransition(
      context,
      organizationId,
      'upgrade',
      options,
    );
  }

  /**
   * Execute subscription downgrade with transaction integrity
   */
  async downgradeSubscription(
    context: IRequestContext,
    organizationId: string,
    options: UpgradeDowngradeOptions,
  ): Promise<SubscriptionTransitionResult> {
    this.logger.log(`Downgrading subscription for organization ${organizationId}`);

    // Additional validation for downgrades
    await this.validateDowngradeConstraints(organizationId, options.newPlanId);

    return await this.executeSubscriptionTransition(
      context,
      organizationId,
      'downgrade',
      options,
    );
  }

  /**
   * Execute subscription renewal with optional plan change
   */
  async renewSubscription(
    context: IRequestContext,
    organizationId: string,
    options: RenewalOptions = {},
  ): Promise<SubscriptionTransitionResult> {
    this.logger.log(`Renewing subscription for organization ${organizationId}`);

    const currentSubscription = await this.getCurrentActiveSubscription(organizationId);
    
    // Determine renewal plan (same plan or new plan)
    const renewalPlanId = options.planId || currentSubscription.subscriptionPlanId;
    
    // Get renewal plan details
    const renewalPlan = await this.getSubscriptionPlan(renewalPlanId);
    
    // Calculate effective date for renewal
    const effectiveDate = this.dateManager.calculateOptimalEffectiveDate(
      'renewal',
      currentSubscription,
      options.effectiveDate,
    );

    // Calculate new end date
    const newEndDate = this.dateManager.calculateNewEndDate(
      renewalPlan,
      effectiveDate,
      options.extendCurrent,
      currentSubscription.endDate,
    );

    // Validate renewal dates
    const validation = this.dateManager.validateSubscriptionDates(
      'renewal',
      currentSubscription,
      effectiveDate,
      newEndDate,
    );

    if (!validation.isValid) {
      throw new ValidationException(
        validation.errors.map(error => ({ field: 'effectiveDate', message: error }))
      );
    }

    // Execute renewal transaction
    return await this.prisma.$transaction(async (tx) => {
      // Deactivate current subscription
      const oldSubscription = await tx.subscriptionOrganization.update({
        where: { id: currentSubscription.id },
        data: {
          isActive: false,
          status: 'expired',
          updatedByUserId: context.getUserId(),
        },
      });

      // Create new subscription
      const newSubscription = await tx.subscriptionOrganization.create({
        data: {
          organizationId,
          subscriptionPlanId: renewalPlanId,
          status: 'active',
          startDate: effectiveDate,
          endDate: newEndDate,
          isActive: true,
          createdByUserId: context.getUserId(),
        },
      });

      // Create operation record
      const operation = await tx.subscriptionOperation.create({
        data: {
          organizationId,
          fromSubscriptionPlanId: currentSubscription.subscriptionPlanId,
          toSubscriptionPlanId: renewalPlanId,
          operationType: 'renewal',
          executedByUserId: context.getUserId(),
          effectiveDate,
          previousEndDate: currentSubscription.endDate,
          newEndDate,
          notes: `Renewal${renewalPlanId !== currentSubscription.subscriptionPlanId ? ' with plan change' : ''}`,
          createdByUserId: context.getUserId(),
        },
      });

      // Audit logging
      await this.auditLogger.logSubscriptionOperation(
        context,
        'SUBSCRIPTION_RENEWAL',
        organizationId,
        {
          oldPlanId: currentSubscription.subscriptionPlanId,
          newPlanId: renewalPlanId,
          effectiveDate: effectiveDate.toISOString(),
          newEndDate: newEndDate.toISOString(),
        },
      );

      return {
        oldSubscription,
        newSubscription,
        operation,
        effectiveDate,
        success: true,
      };
    });
  }

  /**
   * Execute subscription cancellation with refund calculation
   */
  async cancelSubscription(
    context: IRequestContext,
    organizationId: string,
    options: CancellationOptions,
  ): Promise<CancellationResult> {
    this.logger.log(`Cancelling subscription for organization ${organizationId}`);

    const currentSubscription = await this.getCurrentActiveSubscriptionWithPlan(organizationId);
    const organization = await this.getOrganization(organizationId);

    // Calculate effective cancellation date
    const effectiveDate = options.effectiveDate || new Date();

    // Validate cancellation
    const validation = this.dateManager.validateSubscriptionDates(
      'cancellation',
      currentSubscription,
      effectiveDate,
    );

    if (!validation.isValid) {
      throw new ValidationException(
        validation.errors.map(error => ({ field: 'effectiveDate', message: error }))
      );
    }

    // Calculate refund if enabled
    let refundAmount: Decimal | undefined;
    if (options.refundEnabled !== false) {
      const refundCalculation = this.prorationService.calculateCancellationRefund(
        currentSubscription,
        organization.currency,
        effectiveDate,
      );
      refundAmount = refundCalculation.refundAmount;
    }

    // Execute cancellation transaction
    return await this.prisma.$transaction(async (tx) => {
      // Update subscription status
      const cancelledSubscription = await tx.subscriptionOrganization.update({
        where: { id: currentSubscription.id },
        data: {
          status: options.immediate ? 'inactive' : 'active', // Keep active until end date if not immediate
          isActive: options.immediate ? false : true,
          updatedByUserId: context.getUserId(),
        },
      });

      // Create cancellation record
      const cancellation = await tx.subscriptionCancellation.create({
        data: {
          organizationId,
          subscriptionOrganizationId: currentSubscription.id,
          requestedByUserId: context.getUserId(),
          reason: options.reason,
          reasonDescription: options.reasonDescription,
          effectiveDate: options.immediate ? effectiveDate : currentSubscription.endDate,
          refundAmount: refundAmount?.toNumber(),
          retentionOffered: options.retentionOffered || false,
          retentionDetails: options.retentionDetails,
          processedByUserId: context.getUserId(),
          processedAt: new Date(),
          createdByUserId: context.getUserId(),
        },
      });

      // Create operation record
      await tx.subscriptionOperation.create({
        data: {
          organizationId,
          fromSubscriptionPlanId: currentSubscription.subscriptionPlanId,
          toSubscriptionPlanId: null,
          operationType: 'cancellation',
          executedByUserId: context.getUserId(),
          effectiveDate: options.immediate ? effectiveDate : currentSubscription.endDate,
          previousEndDate: currentSubscription.endDate,
          newEndDate: options.immediate ? effectiveDate : currentSubscription.endDate,
          prorationAmount: refundAmount?.toNumber(),
          notes: `Cancellation: ${options.reason}${options.reasonDescription ? ' - ' + options.reasonDescription : ''}`,
          createdByUserId: context.getUserId(),
        },
      });

      // Audit logging
      await this.auditLogger.logSubscriptionOperation(
        context,
        'SUBSCRIPTION_CANCELLATION',
        organizationId,
        {
          reason: options.reason,
          effectiveDate: effectiveDate.toISOString(),
          immediate: options.immediate,
          refundAmount: refundAmount?.toNumber(),
        },
      );

      return {
        subscription: cancelledSubscription,
        cancellation,
        refundAmount,
        effectiveDate: options.immediate ? effectiveDate : currentSubscription.endDate,
        success: true,
      };
    });
  }

  /**
   * Generic subscription transition executor
   */
  private async executeSubscriptionTransition(
    context: IRequestContext,
    organizationId: string,
    operationType: SubscriptionOperationType,
    options: UpgradeDowngradeOptions,
  ): Promise<SubscriptionTransitionResult> {
    const currentSubscription = await this.getCurrentActiveSubscriptionWithPlan(organizationId);
    const newPlan = await this.getSubscriptionPlan(options.newPlanId);
    const organization = await this.getOrganization(organizationId);

    // Calculate effective date
    const effectiveDate = this.dateManager.calculateOptimalEffectiveDate(
      operationType as 'upgrade' | 'downgrade',
      currentSubscription,
      options.effectiveDate,
    );

    // Calculate new end date
    const newEndDate = this.dateManager.calculateNewEndDate(
      newPlan,
      effectiveDate,
      true, // Extend current subscription
      currentSubscription.endDate,
    );

    // Validate dates
    const validation = this.dateManager.validateSubscriptionDates(
      operationType as 'upgrade' | 'downgrade',
      currentSubscription,
      effectiveDate,
      newEndDate,
    );

    if (!validation.isValid) {
      throw new ValidationException(
        validation.errors.map(error => ({ field: 'effectiveDate', message: error }))
      );
    }

    // Calculate proration if enabled
    let proration: ProrationCalculation | undefined;
    if (options.prorationEnabled !== false) {
      proration = this.prorationService.calculateProration(
        currentSubscription,
        newPlan,
        organization.currency,
        effectiveDate,
      );
    }

    // Execute transition transaction
    return await this.prisma.$transaction(async (tx) => {
      // Deactivate current subscription
      const oldSubscription = await tx.subscriptionOrganization.update({
        where: { id: currentSubscription.id },
        data: {
          isActive: false,
          status: 'expired',
          updatedByUserId: context.getUserId(),
        },
      });

      // Create new subscription
      const newSubscription = await tx.subscriptionOrganization.create({
        data: {
          organizationId,
          subscriptionPlanId: options.newPlanId,
          status: 'active',
          startDate: effectiveDate,
          endDate: newEndDate,
          isActive: true,
          createdByUserId: context.getUserId(),
        },
      });

      // Create operation record
      const operation = await tx.subscriptionOperation.create({
        data: {
          organizationId,
          fromSubscriptionPlanId: currentSubscription.subscriptionPlanId,
          toSubscriptionPlanId: options.newPlanId,
          operationType,
          executedByUserId: context.getUserId(),
          effectiveDate,
          previousEndDate: currentSubscription.endDate,
          newEndDate,
          prorationAmount: proration?.netAmount.toNumber(),
          notes: proration?.description,
          createdByUserId: context.getUserId(),
        },
      });

      // Audit logging
      await this.auditLogger.logSubscriptionOperation(
        context,
        `SUBSCRIPTION_${operationType.toUpperCase()}` as any,
        organizationId,
        {
          oldPlanId: currentSubscription.subscriptionPlanId,
          newPlanId: options.newPlanId,
          effectiveDate: effectiveDate.toISOString(),
          prorationAmount: proration?.netAmount.toNumber(),
        },
      );

      return {
        oldSubscription,
        newSubscription,
        operation,
        proration,
        effectiveDate,
        success: true,
      };
    }, {
      timeout: 30000, // 30 second timeout for complex transactions
    });
  }

  /**
   * Validate downgrade constraints (usage limits)
   */
  private async validateDowngradeConstraints(
    organizationId: string,
    newPlanId: string,
  ): Promise<void> {
    const newPlan = await this.getSubscriptionPlan(newPlanId);
    
    // Get current usage statistics
    const [gymsCount, totalClients, totalCollaborators] = await Promise.all([
      this.prisma.gym.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.gymClient.count({
        where: {
          gym: { organizationId, deletedAt: null },
          deletedAt: null,
        },
      }),
      this.prisma.collaborator.count({
        where: {
          gym: { organizationId, deletedAt: null },
          status: 'active',
          deletedAt: null,
        },
      }),
    ]);

    const violations: string[] = [];

    // Check gym limit
    if (gymsCount > newPlan.maxGyms) {
      violations.push(`Current gyms (${gymsCount}) exceeds new plan limit (${newPlan.maxGyms})`);
    }

    // Check client limit
    const newClientLimit = newPlan.maxClientsPerGym * newPlan.maxGyms;
    if (totalClients > newClientLimit) {
      violations.push(`Current clients (${totalClients}) exceeds new plan limit (${newClientLimit})`);
    }

    // Check collaborator limit
    const newCollaboratorLimit = newPlan.maxUsersPerGym * newPlan.maxGyms;
    if (totalCollaborators > newCollaboratorLimit) {
      violations.push(`Current collaborators (${totalCollaborators}) exceeds new plan limit (${newCollaboratorLimit})`);
    }

    if (violations.length > 0) {
      throw new BusinessException(
        `Cannot downgrade due to usage constraints: ${violations.join(', ')}`
      );
    }
  }

  /**
   * Get current active subscription
   */
  private async getCurrentActiveSubscription(organizationId: string): Promise<SubscriptionOrganization> {
    const subscription = await this.prisma.subscriptionOrganization.findFirst({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!subscription) {
      throw new BusinessException('No active subscription found for organization');
    }

    return subscription;
  }

  /**
   * Get current active subscription with plan details
   */
  private async getCurrentActiveSubscriptionWithPlan(
    organizationId: string,
  ): Promise<SubscriptionOrganization & { subscriptionPlan: SubscriptionPlan }> {
    const subscription = await this.prisma.subscriptionOrganization.findFirst({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        subscriptionPlan: true,
      },
    });

    if (!subscription) {
      throw new BusinessException('No active subscription found for organization');
    }

    return subscription;
  }

  /**
   * Get subscription plan by ID
   */
  private async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId, deletedAt: null },
    });

    if (!plan) {
      throw new BusinessException(`Subscription plan not found: ${planId}`);
    }

    if (!plan.isActive) {
      throw new BusinessException(`Subscription plan is not active: ${planId}`);
    }

    return plan;
  }

  /**
   * Get organization by ID
   */
  private async getOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId, deletedAt: null },
    });

    if (!organization) {
      throw new BusinessException(`Organization not found: ${organizationId}`);
    }

    return organization;
  }
}