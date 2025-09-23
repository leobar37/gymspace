import { BaseResource } from './base';
import { RequestOptions } from '../types';

// Import the types we'll define
export interface SubscriptionPlanDto {
  id: string;
  name: string;
  price: {
    PEN?: { currency: 'PEN'; value: number };
    USD?: { currency: 'USD'; value: number };
    COP?: { currency: 'COP'; value: number };
    MXN?: { currency: 'MXN'; value: number };
  };
  billingFrequency: string;
  duration?: number;
  durationPeriod?: string;
  maxGyms: number;
  maxClientsPerGym: number;
  maxUsersPerGym: number;
  features: Record<string, any>;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  activeSubscriptions?: number;
  totalOrganizations?: number;
}

export interface PriceDto {
  currency: string;
  value: number;
}

export interface PricingDto {
  PEN: PriceDto;
}

export interface CreateSubscriptionPlanDto {
  name: string;
  price: PricingDto;
  billingFrequency: string;
  duration?: number;
  durationPeriod?: 'DAY' | 'MONTH';
  maxGyms: number;
  maxClientsPerGym: number;
  maxUsersPerGym: number;
  features: Record<string, any>;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSubscriptionPlanDto {
  name?: string;
  price?: PricingDto;
  billingFrequency?: string;
  duration?: number;
  durationPeriod?: 'DAY' | 'MONTH';
  maxGyms?: number;
  maxClientsPerGym?: number;
  maxUsersPerGym?: number;
  features?: Record<string, any>;
  description?: string;
  isActive?: boolean;
}

export class SubscriptionPlansResource extends BaseResource {
  private basePath = 'admin/subscription-plans';

  /**
   * List all subscription plans (Super Admin only)
   */
  async listPlans(options?: RequestOptions): Promise<SubscriptionPlanDto[]> {
    return this.client.get<SubscriptionPlanDto[]>(`${this.basePath}`, undefined, options);
  }

  /**
   * Create new subscription plan (Super Admin only)
   */
  async createPlan(
    data: CreateSubscriptionPlanDto,
    options?: RequestOptions,
  ): Promise<SubscriptionPlanDto> {
    return this.client.post<SubscriptionPlanDto>(`${this.basePath}`, data, options);
  }

  /**
   * Get subscription plan details (Super Admin only)
   */
  async getPlan(id: string, options?: RequestOptions): Promise<SubscriptionPlanDto> {
    return this.client.get<SubscriptionPlanDto>(`${this.basePath}/${id}`, undefined, options);
  }

  /**
   * Update subscription plan (Super Admin only)
   */
  async updatePlan(
    id: string,
    data: UpdateSubscriptionPlanDto,
    options?: RequestOptions,
  ): Promise<SubscriptionPlanDto> {
    return this.client.put<SubscriptionPlanDto>(`${this.basePath}/${id}`, data, options);
  }

  /**
   * Soft delete subscription plan (Super Admin only)
   */
  async deletePlan(id: string, options?: RequestOptions): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`${this.basePath}/${id}`, options);
  }
}