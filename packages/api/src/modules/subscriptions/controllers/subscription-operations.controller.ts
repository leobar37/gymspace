import { Controller, Put, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AppCtxt, Allow } from '../../../common/decorators';
import { RequestContext } from '../../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';
import { SubscriptionTransitionService } from '../services/subscription-transition.service';
import { ProrationCalculationService } from '../services/proration-calculation.service';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  UpgradeSubscriptionDto,
  UpgradeSubscriptionResponseDto,
  CancelSubscriptionDto,
  CancelSubscriptionResponseDto,
  RenewSubscriptionDto,
  RenewSubscriptionResponseDto,
  CalculateProrationDto,
  ProrationResponseDto,
} from '../dto/subscription-operations.dto';

@ApiTags('Admin - Subscription Operations')
@Controller('admin/organizations')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class SubscriptionOperationsController {
  constructor(
    private readonly transitionService: SubscriptionTransitionService,
    private readonly prorationService: ProrationCalculationService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Upgrade organization subscription with prorating
   */
  @Put(':id/upgrade-subscription')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Upgrade organization subscription with proration',
    description: 'Upgrade an organization to a higher-tier subscription plan with automatic proration calculation and financial adjustments',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription upgraded successfully with proration details',
    type: UpgradeSubscriptionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Super admin access required' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 400, description: 'Invalid upgrade request or business rules violation' })
  async upgradeSubscription(
    @Param('id') organizationId: string,
    @Body() dto: UpgradeSubscriptionDto,
    @AppCtxt() ctx: RequestContext,
  ): Promise<UpgradeSubscriptionResponseDto> {
    const result = await this.transitionService.upgradeSubscription(ctx, organizationId, {
      newPlanId: dto.newPlanId,
      effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
      immediate: dto.immediate,
      prorationEnabled: dto.prorationEnabled,
    });

    // Get plan names for response
    const [oldPlan, newPlan] = await Promise.all([
      this.prisma.subscriptionPlan.findUnique({
        where: { id: result.oldSubscription.subscriptionPlanId },
        select: { name: true },
      }),
      this.prisma.subscriptionPlan.findUnique({
        where: { id: result.newSubscription.subscriptionPlanId },
        select: { name: true },
      }),
    ]);

    return {
      success: result.success,
      effectiveDate: result.effectiveDate.toISOString(),
      oldSubscription: {
        id: result.oldSubscription.id,
        planId: result.oldSubscription.subscriptionPlanId,
        planName: oldPlan?.name || 'Unknown Plan',
        endDate: result.oldSubscription.endDate.toISOString(),
      },
      newSubscription: {
        id: result.newSubscription.id,
        planId: result.newSubscription.subscriptionPlanId,
        planName: newPlan?.name || 'Unknown Plan',
        startDate: result.newSubscription.startDate.toISOString(),
        endDate: result.newSubscription.endDate.toISOString(),
      },
      proration: result.proration ? {
        remainingDays: result.proration.remainingDays,
        totalDays: result.proration.totalDays,
        unusedPercentage: this.prorationService.decimalToNumber(result.proration.unusedPercentage),
        currentPlanPrice: this.prorationService.decimalToNumber(result.proration.currentPlanPrice),
        newPlanPrice: this.prorationService.decimalToNumber(result.proration.newPlanPrice),
        creditAmount: this.prorationService.decimalToNumber(result.proration.creditAmount),
        chargeAmount: this.prorationService.decimalToNumber(result.proration.chargeAmount),
        netAmount: this.prorationService.decimalToNumber(result.proration.netAmount),
        description: result.proration.description,
      } : undefined,
      operationId: result.operation.id,
    };
  }

  /**
   * Cancel organization subscription with refund calculation
   */
  @Post(':id/cancel-subscription')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Cancel organization subscription with refund calculation',
    description: 'Cancel an organization subscription with automatic refund calculation for unused period and retention tracking',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully with refund details',
    type: CancelSubscriptionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Super admin access required' })
  @ApiResponse({ status: 404, description: 'Organization or subscription not found' })
  @ApiResponse({ status: 400, description: 'Invalid cancellation request' })
  async cancelSubscription(
    @Param('id') organizationId: string,
    @Body() dto: CancelSubscriptionDto,
    @AppCtxt() ctx: RequestContext,
  ): Promise<CancelSubscriptionResponseDto> {
    const result = await this.transitionService.cancelSubscription(ctx, organizationId, {
      reason: dto.reason,
      reasonDescription: dto.reasonDescription,
      effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
      immediate: dto.immediate,
      refundEnabled: dto.refundEnabled,
      retentionOffered: dto.retentionOffered,
      retentionDetails: dto.retentionDetails,
    });

    // Get plan name for response
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: result.subscription.subscriptionPlanId },
      select: { name: true },
    });

    return {
      success: result.success,
      effectiveDate: result.effectiveDate.toISOString(),
      subscription: {
        id: result.subscription.id,
        planId: result.subscription.subscriptionPlanId,
        planName: plan?.name || 'Unknown Plan',
        status: result.subscription.status,
      },
      cancellation: {
        id: result.cancellation.id,
        reason: result.cancellation.reason,
        reasonDescription: result.cancellation.reasonDescription,
        refundAmount: result.cancellation.refundAmount,
        retentionOffered: result.cancellation.retentionOffered,
        retentionDetails: result.cancellation.retentionDetails,
      },
      refundAmount: result.refundAmount ? this.prorationService.decimalToNumber(result.refundAmount) : undefined,
    };
  }

  /**
   * Renew organization subscription with optional plan change
   */
  @Post(':id/renew-subscription')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Renew organization subscription with optional plan change',
    description: 'Renew an organization subscription for another billing period, optionally changing the plan during renewal',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription renewed successfully',
    type: RenewSubscriptionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Super admin access required' })
  @ApiResponse({ status: 404, description: 'Organization or subscription not found' })
  @ApiResponse({ status: 400, description: 'Invalid renewal request or not in renewal window' })
  async renewSubscription(
    @Param('id') organizationId: string,
    @Body() dto: RenewSubscriptionDto,
    @AppCtxt() ctx: RequestContext,
  ): Promise<RenewSubscriptionResponseDto> {
    const result = await this.transitionService.renewSubscription(ctx, organizationId, {
      planId: dto.planId,
      duration: dto.duration,
      durationPeriod: dto.durationPeriod,
      effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
      extendCurrent: dto.extendCurrent,
    });

    // Get plan names for response
    const [oldPlan, newPlan] = await Promise.all([
      this.prisma.subscriptionPlan.findUnique({
        where: { id: result.oldSubscription.subscriptionPlanId },
        select: { name: true },
      }),
      this.prisma.subscriptionPlan.findUnique({
        where: { id: result.newSubscription.subscriptionPlanId },
        select: { name: true },
      }),
    ]);

    return {
      success: result.success,
      effectiveDate: result.effectiveDate.toISOString(),
      oldSubscription: {
        id: result.oldSubscription.id,
        planId: result.oldSubscription.subscriptionPlanId,
        planName: oldPlan?.name || 'Unknown Plan',
        endDate: result.oldSubscription.endDate.toISOString(),
      },
      newSubscription: {
        id: result.newSubscription.id,
        planId: result.newSubscription.subscriptionPlanId,
        planName: newPlan?.name || 'Unknown Plan',
        startDate: result.newSubscription.startDate.toISOString(),
        endDate: result.newSubscription.endDate.toISOString(),
      },
      operationId: result.operation.id,
    };
  }

  /**
   * Calculate proration for subscription upgrade/downgrade
   */
  @Get(':id/calculate-proration')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Calculate proration for subscription plan change',
    description: 'Calculate real-time proration amounts for upgrading or downgrading a subscription plan',
  })
  @ApiResponse({
    status: 200,
    description: 'Proration calculation completed',
    type: ProrationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Super admin access required' })
  @ApiResponse({ status: 404, description: 'Organization, subscription, or plan not found' })
  @ApiResponse({ status: 400, description: 'Invalid proration request' })
  async calculateProration(
    @Param('id') organizationId: string,
    @Body() dto: CalculateProrationDto,
    @AppCtxt() ctx: RequestContext,
  ): Promise<ProrationResponseDto> {
    // Get current subscription
    const currentSubscription = await this.prisma.subscriptionOrganization.findFirst({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        subscriptionPlan: true,
      },
    });

    if (!currentSubscription) {
      throw new Error('No active subscription found for organization');
    }

    // Get new plan
    const newPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.newPlanId, deletedAt: null },
    });

    if (!newPlan) {
      throw new Error(`Subscription plan not found: ${dto.newPlanId}`);
    }

    // Get organization for currency
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId, deletedAt: null },
    });

    if (!organization) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    // Calculate proration
    const changeDate = dto.effectiveDate ? new Date(dto.effectiveDate) : new Date();
    const proration = this.prorationService.calculateProration(
      currentSubscription,
      newPlan,
      organization.currency,
      changeDate,
    );

    return {
      remainingDays: proration.remainingDays,
      totalDays: proration.totalDays,
      unusedPercentage: this.prorationService.decimalToNumber(proration.unusedPercentage),
      currentPlanPrice: this.prorationService.decimalToNumber(proration.currentPlanPrice),
      newPlanPrice: this.prorationService.decimalToNumber(proration.newPlanPrice),
      creditAmount: this.prorationService.decimalToNumber(proration.creditAmount),
      chargeAmount: this.prorationService.decimalToNumber(proration.chargeAmount),
      netAmount: this.prorationService.decimalToNumber(proration.netAmount),
      description: proration.description,
      currency: organization.currency,
    };
  }
}