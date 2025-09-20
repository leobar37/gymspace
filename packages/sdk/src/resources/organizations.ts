import { BaseResource } from './base';
import { Organization, UpdateOrganizationDto, OrganizationStats, OrganizationWithDetails } from '../models/organizations';
import { OrganizationSubscriptionDetailsDto, OrganizationWithEnhancedDetails } from '../models/subscription-operations';
import { RequestOptions } from '../types';

export class OrganizationsResource extends BaseResource {
  private basePath = 'organizations';

  async getOrganization(id: string, options?: RequestOptions): Promise<Organization> {
    return this.client.get<Organization>(`${this.basePath}/${id}`, undefined, options);
  }

  async updateOrganization(
    id: string, 
    data: UpdateOrganizationDto, 
    options?: RequestOptions
  ): Promise<Organization> {
    return this.client.put<Organization>(`${this.basePath}/${id}`, data, options);
  }

  async getOrganizationStats(id: string, options?: RequestOptions): Promise<OrganizationStats> {
    return this.client.get<OrganizationStats>(`${this.basePath}/${id}/stats`, undefined, options);
  }

  async listOrganizations(options?: RequestOptions): Promise<OrganizationWithEnhancedDetails[]> {
    return this.client.get<OrganizationWithEnhancedDetails[]>(`${this.basePath}/list`, undefined, options);
  }

  // Enhanced admin endpoints with subscription data

  /**
   * Get detailed organization information with subscription data (SUPER_ADMIN only)
   */
  async getOrganizationById(id: string, options?: RequestOptions): Promise<OrganizationSubscriptionDetailsDto> {
    return this.client.get<OrganizationSubscriptionDetailsDto>(`${this.basePath}/admin/${id}`, undefined, options);
  }

  // Convenience methods for organization management

  /**
   * Check if organization can add more gyms
   */
  async canAddGym(id: string, options?: RequestOptions): Promise<boolean> {
    const stats = await this.getOrganizationStats(id, options);
    return stats.usage.gyms.percentage < 100;
  }

  /**
   * Get organization usage summary
   */
  async getUsageSummary(id: string, options?: RequestOptions): Promise<{
    gyms: { current: number; limit: number; percentage: number };
    clients: { current: number; limit: number; percentage: number };
    collaborators: { current: number; limit: number; percentage: number };
  }> {
    const stats = await this.getOrganizationStats(id, options);
    return stats.usage;
  }

  /**
   * Check if organization subscription is expiring soon
   */
  async isSubscriptionExpiring(id: string, options?: RequestOptions): Promise<{
    isExpiring: boolean;
    isExpired: boolean;
    daysUntilExpiration: number;
  }> {
    const details = await this.getOrganizationById(id, options);
    if (!details.currentSubscription) {
      return { isExpiring: false, isExpired: true, daysUntilExpiration: 0 };
    }
    
    return {
      isExpiring: details.currentSubscription.isExpiring,
      isExpired: details.currentSubscription.isExpired,
      daysUntilExpiration: details.currentSubscription.daysUntilExpiration,
    };
  }

  /**
   * Get organizations that are expiring soon
   */
  async getExpiringSoonOrganizations(options?: RequestOptions): Promise<OrganizationWithEnhancedDetails[]> {
    const organizations = await this.listOrganizations(options);
    return organizations.filter(org => 
      org.subscription?.isExpiring || 
      (org.subscription?.daysUntilExpiration !== undefined && org.subscription.daysUntilExpiration <= 7)
    );
  }

  /**
   * Get organizations by usage threshold
   */
  async getOrganizationsByUsage(
    usageType: 'gyms' | 'clients' | 'collaborators',
    threshold: number = 80,
    options?: RequestOptions
  ): Promise<OrganizationWithEnhancedDetails[]> {
    const organizations = await this.listOrganizations(options);
    return organizations.filter(org => {
      if (!org.usage) return false;
      return org.usage[usageType].percentage >= threshold;
    });
  }
}