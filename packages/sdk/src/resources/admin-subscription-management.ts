import { BaseResource } from './base';
import { RequestOptions } from '../types';

// Import types from existing subscriptions model and add new ones
export interface AdminSubscriptionStatusDto {
  id: string;
  organizationId: string;
  subscriptionPlanId: string;
  planName: string;
  status: string; // Should match SubscriptionStatus enum
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivateRenewalDto {
  subscriptionPlanId?: string;
  durationMonths?: number;
  notes?: string;
}

export interface CancelSubscriptionDto {
  reason: string;
  immediateTermination?: boolean;
  notes?: string;
}

export interface UpgradeSubscriptionDto {
  newSubscriptionPlanId: string;
  immediateUpgrade?: boolean;
  notes?: string;
}

export interface SubscriptionHistoryDto {
  id: string;
  planName: string;
  status: string; // Should match SubscriptionStatus enum
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}

export class AdminSubscriptionManagementResource extends BaseResource {
  private basePath = 'admin/organizations';

  /**
   * Activate subscription renewal for an organization (Super Admin only)
   */
  async activateRenewal(
    organizationId: string,
    data: ActivateRenewalDto,
    options?: RequestOptions,
  ): Promise<AdminSubscriptionStatusDto> {
    return this.client.post<AdminSubscriptionStatusDto>(
      `${this.basePath}/${organizationId}/subscriptions/activate-renewal`,
      data,
      options,
    );
  }

  /**
   * Cancel subscription for an organization (Super Admin only)
   */
  async cancelSubscription(
    organizationId: string,
    data: CancelSubscriptionDto,
    options?: RequestOptions,
  ): Promise<AdminSubscriptionStatusDto> {
    return this.client.post<AdminSubscriptionStatusDto>(
      `${this.basePath}/${organizationId}/subscriptions/cancel`,
      data,
      options,
    );
  }

  /**
   * Upgrade subscription plan for an organization (Super Admin only)
   */
  async upgradeSubscription(
    organizationId: string,
    data: UpgradeSubscriptionDto,
    options?: RequestOptions,
  ): Promise<AdminSubscriptionStatusDto> {
    return this.client.post<AdminSubscriptionStatusDto>(
      `${this.basePath}/${organizationId}/subscriptions/upgrade`,
      data,
      options,
    );
  }

  /**
   * Get subscription history for an organization (Super Admin only)
   */
  async getSubscriptionHistory(
    organizationId: string,
    options?: RequestOptions,
  ): Promise<SubscriptionHistoryDto[]> {
    return this.client.get<SubscriptionHistoryDto[]>(
      `${this.basePath}/${organizationId}/subscriptions/history`,
      undefined,
      options,
    );
  }
}