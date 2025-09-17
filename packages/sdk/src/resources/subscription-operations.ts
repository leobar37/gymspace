import { BaseResource } from './base';
import { RequestOptions } from '../types';
import {
  UpgradeSubscriptionDto,
  UpgradeSubscriptionResponseDto,
  CancelSubscriptionDto,
  CancelSubscriptionResponseDto,
  RenewSubscriptionDto,
  RenewSubscriptionResponseDto,
  CalculateProrationDto,
  ProrationResponseDto,
} from '../models/subscription-operations';

export class SubscriptionOperationsResource extends BaseResource {
  private basePath = 'admin/organizations';

  /**
   * Upgrade organization subscription with proration
   */
  async upgradeSubscription(
    organizationId: string,
    data: UpgradeSubscriptionDto,
    options?: RequestOptions,
  ): Promise<UpgradeSubscriptionResponseDto> {
    return this.client.put<UpgradeSubscriptionResponseDto>(
      `${this.basePath}/${organizationId}/upgrade-subscription`,
      data,
      options,
    );
  }

  /**
   * Downgrade organization subscription with usage validation
   */
  async downgradeSubscription(
    organizationId: string,
    data: UpgradeSubscriptionDto, // Same DTO as upgrade
    options?: RequestOptions,
  ): Promise<UpgradeSubscriptionResponseDto> {
    return this.client.put<UpgradeSubscriptionResponseDto>(
      `${this.basePath}/${organizationId}/downgrade-subscription`,
      data,
      options,
    );
  }

  /**
   * Cancel organization subscription with refund calculation
   */
  async cancelSubscription(
    organizationId: string,
    data: CancelSubscriptionDto,
    options?: RequestOptions,
  ): Promise<CancelSubscriptionResponseDto> {
    return this.client.post<CancelSubscriptionResponseDto>(
      `${this.basePath}/${organizationId}/cancel-subscription`,
      data,
      options,
    );
  }

  /**
   * Renew organization subscription with optional plan change
   */
  async renewSubscription(
    organizationId: string,
    data: RenewSubscriptionDto,
    options?: RequestOptions,
  ): Promise<RenewSubscriptionResponseDto> {
    return this.client.post<RenewSubscriptionResponseDto>(
      `${this.basePath}/${organizationId}/renew-subscription`,
      data,
      options,
    );
  }

  /**
   * Calculate proration for subscription plan change
   */
  async calculateProration(
    organizationId: string,
    data: CalculateProrationDto,
    options?: RequestOptions,
  ): Promise<ProrationResponseDto> {
    return this.client.get<ProrationResponseDto>(
      `${this.basePath}/${organizationId}/calculate-proration`,
      data,
      options,
    );
  }

  // Convenience methods for common operations

  /**
   * Get upgrade proration calculation
   */
  async getUpgradeProration(
    organizationId: string,
    newPlanId: string,
    effectiveDate?: string,
    options?: RequestOptions,
  ): Promise<ProrationResponseDto> {
    return this.calculateProration(
      organizationId,
      { newPlanId, effectiveDate },
      options,
    );
  }

  /**
   * Immediate subscription upgrade with default proration
   */
  async immediateUpgrade(
    organizationId: string,
    newPlanId: string,
    options?: RequestOptions,
  ): Promise<UpgradeSubscriptionResponseDto> {
    return this.upgradeSubscription(
      organizationId,
      {
        newPlanId,
        immediate: true,
        prorationEnabled: true,
      },
      options,
    );
  }

  /**
   * Immediate subscription cancellation with refund
   */
  async immediateCancellation(
    organizationId: string,
    reason: 'cost_too_high' | 'feature_limitations' | 'switching_providers' | 'business_closure' | 'technical_issues' | 'poor_support' | 'other',
    reasonDescription?: string,
    options?: RequestOptions,
  ): Promise<CancelSubscriptionResponseDto> {
    return this.cancelSubscription(
      organizationId,
      {
        reason,
        reasonDescription,
        immediate: true,
        refundEnabled: true,
        retentionOffered: false,
      },
      options,
    );
  }

  /**
   * End-of-period cancellation without immediate effect
   */
  async endOfPeriodCancellation(
    organizationId: string,
    reason: 'cost_too_high' | 'feature_limitations' | 'switching_providers' | 'business_closure' | 'technical_issues' | 'poor_support' | 'other',
    reasonDescription?: string,
    retentionOffered: boolean = false,
    retentionDetails?: string,
    options?: RequestOptions,
  ): Promise<CancelSubscriptionResponseDto> {
    return this.cancelSubscription(
      organizationId,
      {
        reason,
        reasonDescription,
        immediate: false,
        refundEnabled: false,
        retentionOffered,
        retentionDetails,
      },
      options,
    );
  }

  /**
   * Simple renewal with same plan
   */
  async simpleRenewal(
    organizationId: string,
    options?: RequestOptions,
  ): Promise<RenewSubscriptionResponseDto> {
    return this.renewSubscription(
      organizationId,
      { extendCurrent: true },
      options,
    );
  }

  /**
   * Renewal with plan change
   */
  async renewalWithPlanChange(
    organizationId: string,
    newPlanId: string,
    options?: RequestOptions,
  ): Promise<RenewSubscriptionResponseDto> {
    return this.renewSubscription(
      organizationId,
      {
        planId: newPlanId,
        extendCurrent: true,
      },
      options,
    );
  }
}