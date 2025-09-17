import { PaginatedResponse } from '@gymspace/shared';
import {
  CreatePlanDto,
  UpdatePlanDto,
  SubscriptionPlanResponseDto,
  SubscriptionRequestResponseDto,
  ProcessRequestDto,
  SubscriptionOperationResponseDto,
  CancellationResponseDto,
  SubscriptionAnalyticsDto,
  SubscriptionAnalyticsQueryDto,
  RevenueAnalyticsDto,
  UsageTrendsDto,
  RequestAnalyticsDto,
  RequestAnalyticsQueryDto,
  SubscriptionHistoryDto,
  SubscriptionHistoryQueryDto,
} from '../models/admin-subscriptions';
import { RequestOptions } from '../types';
import { BaseResource } from './base';

export class AdminSubscriptionsResource extends BaseResource {
  private basePath = 'admin/subscriptions';

  // Subscription Plans Management

  /**
   * Create a new subscription plan
   */
  async createPlan(
    data: CreatePlanDto,
    options?: RequestOptions,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.client.post<SubscriptionPlanResponseDto>(
      `${this.basePath}/plans`,
      data,
      options,
    );
  }

  /**
   * Get all subscription plans with usage statistics
   */
  async getPlans(options?: RequestOptions): Promise<SubscriptionPlanResponseDto[]> {
    return this.client.get<SubscriptionPlanResponseDto[]>(
      `${this.basePath}/plans`,
      undefined,
      options,
    );
  }

  /**
   * Get a specific subscription plan by ID
   */
  async getPlanById(
    planId: string,
    options?: RequestOptions,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.client.get<SubscriptionPlanResponseDto>(
      `${this.basePath}/plans/${planId}`,
      undefined,
      options,
    );
  }

  /**
   * Update a subscription plan
   */
  async updatePlan(
    planId: string,
    data: UpdatePlanDto,
    options?: RequestOptions,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.client.put<SubscriptionPlanResponseDto>(
      `${this.basePath}/plans/${planId}`,
      data,
      options,
    );
  }

  /**
   * Delete a subscription plan (soft delete)
   */
  async deletePlan(planId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/plans/${planId}`, options);
  }

  // Subscription Requests Management

  /**
   * Get pending subscription requests
   */
  async getPendingRequests(
    options?: RequestOptions,
  ): Promise<SubscriptionRequestResponseDto[]> {
    return this.client.get<SubscriptionRequestResponseDto[]>(
      `${this.basePath}/requests/pending`,
      undefined,
      options,
    );
  }

  /**
   * Process a subscription request (approve, reject, or cancel)
   */
  async processRequest(
    requestId: string,
    data: ProcessRequestDto,
    options?: RequestOptions,
  ): Promise<SubscriptionRequestResponseDto> {
    return this.client.post<SubscriptionRequestResponseDto>(
      `${this.basePath}/requests/${requestId}/process`,
      data,
      options,
    );
  }

  // Subscription Operations History

  /**
   * Get subscription operations history with pagination
   */
  async getOperations(
    params?: {
      page?: number;
      limit?: number;
    },
    options?: RequestOptions,
  ): Promise<PaginatedResponse<SubscriptionOperationResponseDto>> {
    return this.client.get<PaginatedResponse<SubscriptionOperationResponseDto>>(
      `${this.basePath}/operations`,
      params,
      options,
    );
  }

  // Subscription Cancellations

  /**
   * Get subscription cancellation requests and their status
   */
  async getCancellations(options?: RequestOptions): Promise<CancellationResponseDto[]> {
    return this.client.get<CancellationResponseDto[]>(
      `${this.basePath}/cancellations`,
      undefined,
      options,
    );
  }

  // Analytics Methods

  /**
   * Get comprehensive subscription analytics
   */
  async getSubscriptionAnalytics(
    query?: SubscriptionAnalyticsQueryDto,
    options?: RequestOptions,
  ): Promise<SubscriptionAnalyticsDto> {
    return this.client.get<SubscriptionAnalyticsDto>(
      `${this.basePath}/analytics/subscriptions`,
      query,
      options,
    );
  }

  /**
   * Get revenue analytics including MRR, ARR, and trends
   */
  async getRevenueAnalytics(
    query?: SubscriptionAnalyticsQueryDto,
    options?: RequestOptions,
  ): Promise<RevenueAnalyticsDto> {
    return this.client.get<RevenueAnalyticsDto>(
      `${this.basePath}/analytics/revenue`,
      query,
      options,
    );
  }

  /**
   * Get usage trends and organization utilization patterns
   */
  async getUsageTrends(
    query?: SubscriptionAnalyticsQueryDto,
    options?: RequestOptions,
  ): Promise<UsageTrendsDto> {
    return this.client.get<UsageTrendsDto>(
      `${this.basePath}/analytics/usage-trends`,
      query,
      options,
    );
  }

  /**
   * Get subscription request analytics
   */
  async getRequestAnalytics(
    query?: RequestAnalyticsQueryDto,
    options?: RequestOptions,
  ): Promise<RequestAnalyticsDto> {
    return this.client.get<RequestAnalyticsDto>(
      `${this.basePath}/analytics/requests`,
      query,
      options,
    );
  }

  // Enhanced Request Management

  /**
   * Get subscription requests with advanced filtering
   */
  async getRequests(
    query?: RequestAnalyticsQueryDto,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<SubscriptionRequestResponseDto>> {
    return this.client.get<PaginatedResponse<SubscriptionRequestResponseDto>>(
      `${this.basePath}/requests`,
      query,
      options,
    );
  }

  /**
   * Process subscription request with enhanced workflow and notifications
   */
  async processRequestEnhanced(
    requestId: string,
    data: ProcessRequestDto,
    options?: RequestOptions,
  ): Promise<SubscriptionRequestResponseDto> {
    return this.client.put<SubscriptionRequestResponseDto>(
      `${this.basePath}/requests/${requestId}/process`,
      data,
      options,
    );
  }

  // Subscription History

  /**
   * Get complete subscription history for an organization
   */
  async getOrganizationSubscriptionHistory(
    organizationId: string,
    query?: SubscriptionHistoryQueryDto,
    options?: RequestOptions,
  ): Promise<SubscriptionHistoryDto> {
    return this.client.get<SubscriptionHistoryDto>(
      `${this.basePath}/organizations/${organizationId}/subscription-history`,
      query,
      options,
    );
  }

  // Cache Management (Optional methods for cache control)

  /**
   * Clear analytics cache (admin only)
   */
  async clearAnalyticsCache(options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `${this.basePath}/cache/analytics`,
      options,
    );
  }

  /**
   * Get cache statistics
   */
  async getCacheStatistics(options?: RequestOptions): Promise<any> {
    return this.client.get<any>(
      `${this.basePath}/cache/statistics`,
      undefined,
      options,
    );
  }
}