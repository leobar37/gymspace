import { Injectable, Logger } from '@nestjs/common';
import { IRequestContext, SubscriptionStatus } from '@gymspace/shared';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { PrismaService } from '../../core/database/prisma.service';
import { MercadoPagoService, CreateSubscriptionDto } from './mercadopago.service';

interface UpgradeSubscriptionParams {
  newPlanId: string;
  customerEmail: string;
  backUrl: string;
}

interface SubscriptionMercadoPagoData {
  id: string;
  subscriptionPlan: {
    id: string;
    name: string;
    price: any;
    mercadopagoId: string | null;
  };
  organization: {
    id: string;
    name: string;
  };
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  metadata: any;
}

@Injectable()
export class SubscriptionHelperService {
  private readonly logger = new Logger(SubscriptionHelperService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadopagoService: MercadoPagoService,
  ) {}

  /**
   * Pause an internal subscription
   * This method pauses both our internal subscription and the MercadoPago subscription if it exists
   */
  async pauseSubscription(subscriptionId: string, context: IRequestContext): Promise<void> {
    this.logger.log(`Pausing subscription: ${subscriptionId}`);

    const subscription = await this.getSubscriptionWithDetails(subscriptionId);

    if (subscription.status === 'paused' as SubscriptionStatus) {
      throw new BusinessException('Subscription is already paused');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BusinessException('Only active subscriptions can be paused');
    }

    try {
      // Update internal subscription status
      await this.prisma.subscriptionOrganization.update({
        where: { id: subscriptionId },
        data: {
          status: 'paused' as SubscriptionStatus,
          updatedByUserId: context.getUserId(),
          metadata: {
            ...(subscription.metadata as object || {}),
            pausedAt: new Date().toISOString(),
            pausedBy: context.getUserId(),
          },
        },
      });

      // Pause MercadoPago subscription if it exists
      const mercadopagoSubscriptionId = this.getMercadoPagoSubscriptionId(subscription);
      if (mercadopagoSubscriptionId && this.mercadopagoService.isConfigured()) {
        await this.mercadopagoService.pauseSubscription(mercadopagoSubscriptionId);
        this.logger.log(`Successfully paused MercadoPago subscription: ${mercadopagoSubscriptionId}`);
      }

      this.logger.log(`Successfully paused subscription: ${subscriptionId}`);
    } catch (error) {
      this.logger.error(`Error pausing subscription: ${subscriptionId}`, error);
      throw new BusinessException(`Failed to pause subscription: ${error.message}`);
    }
  }

  /**
   * Upgrade a subscription and create MercadoPago affiliation for payment
   * This method creates the payment flow for the client to complete the upgrade
   */
  async upgradeSubscription(
    subscriptionId: string,
    params: UpgradeSubscriptionParams,
    context: IRequestContext,
  ): Promise<{ paymentUrl: string; subscriptionId: string }> {
    this.logger.log(`Upgrading subscription: ${subscriptionId} to plan: ${params.newPlanId}`);

    const currentSubscription = await this.getSubscriptionWithDetails(subscriptionId);
    const newPlan = await this.getSubscriptionPlan(params.newPlanId);

    // Validate upgrade eligibility
    this.validateUpgradeEligibility(currentSubscription, newPlan);

    try {
      // Create MercadoPago subscription if the new plan requires payment
      if (!this.isFreePlan(newPlan.price) && this.mercadopagoService.isConfigured()) {
        if (!newPlan.mercadopagoId) {
          throw new BusinessException('Target plan is not synchronized with MercadoPago');
        }

        // Create MercadoPago subscription
        const mercadopagoSubscriptionData: CreateSubscriptionDto = {
          preapproval_plan_id: newPlan.mercadopagoId,
          reason: `Upgrade to ${newPlan.name} plan`,
          external_reference: subscriptionId,
          payer_email: params.customerEmail,
          auto_recurring: {
            frequency: this.getFrequencyFromBillingFrequency(newPlan.billingFrequency),
            frequency_type: this.getFrequencyTypeFromBillingFrequency(newPlan.billingFrequency),
            transaction_amount: this.getPriceAmount(newPlan.price),
            currency_id: this.getPriceCurrency(newPlan.price),
          },
          back_url: params.backUrl,
          status: 'pending',
        };

        const mercadopagoSubscription = await this.mercadopagoService.createSubscription(mercadopagoSubscriptionData);

        // Update internal subscription with pending upgrade status and MercadoPago reference
        await this.prisma.subscriptionOrganization.update({
          where: { id: subscriptionId },
          data: {
            status: 'pending_upgrade' as SubscriptionStatus,
            updatedByUserId: context.getUserId(),
            metadata: {
              ...(currentSubscription.metadata as object || {}),
              upgradeRequest: {
                targetPlanId: params.newPlanId,
                mercadopagoSubscriptionId: mercadopagoSubscription.id,
                requestedAt: new Date().toISOString(),
                requestedBy: context.getUserId(),
              },
            },
          },
        });

        this.logger.log(`Created MercadoPago subscription for upgrade: ${mercadopagoSubscription.id}`);

        // Return payment URL for client redirection
        return {
          paymentUrl: mercadopagoSubscription.init_point || '',
          subscriptionId: mercadopagoSubscription.id,
        };
      } else {
        // For free plans, directly upgrade without payment
        await this.completeFreeUpgrade(subscriptionId, params.newPlanId, context);
        
        return {
          paymentUrl: params.backUrl, // Redirect back to success page
          subscriptionId: subscriptionId,
        };
      }
    } catch (error) {
      this.logger.error(`Error upgrading subscription: ${subscriptionId}`, error);
      throw new BusinessException(`Failed to upgrade subscription: ${error.message}`);
    }
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId: string, context: IRequestContext): Promise<void> {
    this.logger.log(`Resuming subscription: ${subscriptionId}`);

    const subscription = await this.getSubscriptionWithDetails(subscriptionId);

    if (subscription.status !== ('paused' as SubscriptionStatus)) {
      throw new BusinessException('Only paused subscriptions can be resumed');
    }

    try {
      // Update internal subscription status
      await this.prisma.subscriptionOrganization.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          updatedByUserId: context.getUserId(),
          metadata: {
            ...(subscription.metadata as object || {}),
            resumedAt: new Date().toISOString(),
            resumedBy: context.getUserId(),
          },
        },
      });

      // Resume MercadoPago subscription if it exists
      const mercadopagoSubscriptionId = this.getMercadoPagoSubscriptionId(subscription);
      if (mercadopagoSubscriptionId && this.mercadopagoService.isConfigured()) {
        await this.mercadopagoService.resumeSubscription(mercadopagoSubscriptionId);
        this.logger.log(`Successfully resumed MercadoPago subscription: ${mercadopagoSubscriptionId}`);
      }

      this.logger.log(`Successfully resumed subscription: ${subscriptionId}`);
    } catch (error) {
      this.logger.error(`Error resuming subscription: ${subscriptionId}`, error);
      throw new BusinessException(`Failed to resume subscription: ${error.message}`);
    }
  }

  /**
   * Complete upgrade after successful payment (webhook handler)
   */
  async completeUpgrade(subscriptionId: string, mercadopagoSubscriptionId: string): Promise<void> {
    this.logger.log(`Completing upgrade for subscription: ${subscriptionId}`);

    const subscription = await this.getSubscriptionWithDetails(subscriptionId);
    
    if (subscription.status !== ('pending_upgrade' as SubscriptionStatus)) {
      throw new BusinessException('Subscription is not in pending upgrade status');
    }

    const upgradeRequest = (subscription.metadata as any)?.upgradeRequest;
    if (!upgradeRequest || upgradeRequest.mercadopagoSubscriptionId !== mercadopagoSubscriptionId) {
      throw new BusinessException('Invalid upgrade request or MercadoPago subscription ID mismatch');
    }

    try {
      const newPlan = await this.getSubscriptionPlan(upgradeRequest.targetPlanId);
      const newEndDate = this.calculateNewEndDate(subscription.startDate, newPlan);

      await this.prisma.subscriptionOrganization.update({
        where: { id: subscriptionId },
        data: {
          subscriptionPlanId: upgradeRequest.targetPlanId,
          status: SubscriptionStatus.ACTIVE,
          endDate: newEndDate,
          metadata: {
            ...(subscription.metadata as object || {}),
            upgradeCompleted: {
              completedAt: new Date().toISOString(),
              fromPlanId: subscription.subscriptionPlan.id,
              toPlanId: upgradeRequest.targetPlanId,
              mercadopagoSubscriptionId,
            },
            upgradeRequest: undefined, // Remove pending upgrade request
          },
        },
      });

      this.logger.log(`Successfully completed upgrade for subscription: ${subscriptionId}`);
    } catch (error) {
      this.logger.error(`Error completing upgrade for subscription: ${subscriptionId}`, error);
      throw new BusinessException(`Failed to complete upgrade: ${error.message}`);
    }
  }

  // Private helper methods

  private async getSubscriptionWithDetails(subscriptionId: string): Promise<SubscriptionMercadoPagoData> {
    const subscription = await this.prisma.subscriptionOrganization.findUnique({
      where: { id: subscriptionId },
      include: {
        subscriptionPlan: true,
        organization: true,
      },
    });

    if (!subscription) {
      throw new ResourceNotFoundException('Subscription not found');
    }

    return subscription as SubscriptionMercadoPagoData;
  }

  private async getSubscriptionPlan(planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new ResourceNotFoundException('Subscription plan not found');
    }

    return plan;
  }

  private validateUpgradeEligibility(currentSubscription: SubscriptionMercadoPagoData, newPlan: any): void {
    if (currentSubscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BusinessException('Only active subscriptions can be upgraded');
    }

    if (currentSubscription.subscriptionPlan.id === newPlan.id) {
      throw new BusinessException('Cannot upgrade to the same plan');
    }

    // Add additional business logic validation here
    // e.g., check if upgrade is to a higher tier, validate pricing, etc.
  }

  private isFreePlan(price: any): boolean {
    if (typeof price === 'object' && price !== null) {
      return Object.values(price).every((amount: any) => amount === 0);
    }
    return price === 0;
  }

  private async completeFreeUpgrade(subscriptionId: string, newPlanId: string, context: IRequestContext): Promise<void> {
    const newPlan = await this.getSubscriptionPlan(newPlanId);
    const subscription = await this.getSubscriptionWithDetails(subscriptionId);
    const newEndDate = this.calculateNewEndDate(subscription.startDate, newPlan);

    await this.prisma.subscriptionOrganization.update({
      where: { id: subscriptionId },
      data: {
        subscriptionPlanId: newPlanId,
        status: SubscriptionStatus.ACTIVE,
        endDate: newEndDate,
        updatedByUserId: context.getUserId(),
        metadata: {
          ...(subscription.metadata as object || {}),
          upgradeCompleted: {
            completedAt: new Date().toISOString(),
            fromPlanId: subscription.subscriptionPlan.id,
            toPlanId: newPlanId,
            type: 'free_upgrade',
          },
        },
      },
    });
  }

  private getMercadoPagoSubscriptionId(subscription: SubscriptionMercadoPagoData): string | null {
    const metadata = subscription.metadata as any;
    return metadata?.mercadopagoSubscriptionId || 
           metadata?.upgradeRequest?.mercadopagoSubscriptionId || 
           null;
  }

  private getFrequencyFromBillingFrequency(billingFrequency: string): number {
    switch (billingFrequency.toLowerCase()) {
      case 'monthly':
        return 1;
      case 'quarterly':
        return 3;
      case 'yearly':
        return 1;
      default:
        return 1;
    }
  }

  private getFrequencyTypeFromBillingFrequency(billingFrequency: string): 'months' | 'days' | 'weeks' {
    switch (billingFrequency.toLowerCase()) {
      case 'yearly':
        return 'months'; // 12 months
      case 'monthly':
      case 'quarterly':
        return 'months';
      default:
        return 'months';
    }
  }

  private getPriceAmount(price: any): number {
    if (typeof price === 'object' && price !== null) {
      // Assume the first currency or a default currency
      const currencies = Object.keys(price);
      return currencies.length > 0 ? price[currencies[0]] : 0;
    }
    return price || 0;
  }

  private getPriceCurrency(price: any): string {
    if (typeof price === 'object' && price !== null) {
      const currencies = Object.keys(price);
      return currencies.length > 0 ? currencies[0].toUpperCase() : 'ARS';
    }
    return 'ARS'; // Default currency
  }

  private calculateNewEndDate(startDate: Date, newPlan: any): Date {
    const start = new Date(startDate);
    
    if (!newPlan.duration || !newPlan.durationPeriod) {
      // If no duration specified, set to 1 year from now
      return new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
    }

    switch (newPlan.durationPeriod) {
      case 'DAY':
        return new Date(start.getTime() + (newPlan.duration * 24 * 60 * 60 * 1000));
      case 'MONTH':
        return new Date(start.getFullYear(), start.getMonth() + newPlan.duration, start.getDate());
      case 'YEAR':
        return new Date(start.getFullYear() + newPlan.duration, start.getMonth(), start.getDate());
      default:
        return new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
    }
  }
}