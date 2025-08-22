import {
  AvailablePlanDto,
  SubscriptionStatusDto,
  AffiliateOrganizationDto,
  CheckLimitResponse,
} from '../models/subscriptions';
import { RequestOptions } from '../types';
import { BaseResource } from './base';

export class SubscriptionsResource extends BaseResource {
  private basePath = 'subscriptions';

  /**
   * Get available subscription plans (currently only free plans)
   */
  async getAvailablePlans(options?: RequestOptions): Promise<AvailablePlanDto[]> {
    return this.client.get<AvailablePlanDto[]>(`${this.basePath}/plans`, undefined, options);
  }

  /**
   * Get subscription status for an organization
   */
  async getSubscriptionStatus(
    organizationId: string,
    options?: RequestOptions,
  ): Promise<SubscriptionStatusDto> {
    return this.client.get<SubscriptionStatusDto>(
      `${this.basePath}/organizations/${organizationId}/status`,
      undefined,
      options,
    );
  }

  /**
   * Affiliate organization to a subscription plan
   */
  async affiliateOrganization(
    organizationId: string,
    data: AffiliateOrganizationDto,
    options?: RequestOptions,
  ): Promise<SubscriptionStatusDto> {
    return this.client.post<SubscriptionStatusDto>(
      `${this.basePath}/organizations/${organizationId}/affiliate`,
      data,
      options,
    );
  }

  /**
   * Check subscription limits
   * @param organizationId Organization ID
   * @param limitType Type of limit to check: 'gyms', 'clients', or 'users'
   */
  async checkSubscriptionLimit(
    organizationId: string,
    limitType: 'gyms' | 'clients' | 'users',
    options?: RequestOptions,
  ): Promise<CheckLimitResponse> {
    return this.client.get<CheckLimitResponse>(
      `${this.basePath}/organizations/${organizationId}/limits/${limitType}`,
      undefined,
      options,
    );
  }
}