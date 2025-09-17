import { PaginatedResponse } from '@gymspace/shared';

// Enums
export enum DurationPeriod {
  DAY = 'DAY',
  MONTH = 'MONTH',
}

export enum SubscriptionRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum SubscriptionOperationType {
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  RENEWAL = 'renewal',
  CANCELLATION = 'cancellation',
  ACTIVATION = 'activation',
}

export enum CancellationReason {
  COST_TOO_HIGH = 'cost_too_high',
  FEATURE_LIMITATIONS = 'feature_limitations',
  SWITCHING_PROVIDERS = 'switching_providers',
  BUSINESS_CLOSURE = 'business_closure',
  TECHNICAL_ISSUES = 'technical_issues',
  POOR_SUPPORT = 'poor_support',
  OTHER = 'other',
}

// DTOs for Plan Management
export interface CreatePlanDto {
  name: string;
  description?: string;
  price: Record<string, { value: number }>;
  billingFrequency: string;
  duration?: number;
  durationPeriod?: DurationPeriod;
  maxGyms: number;
  maxClientsPerGym: number;
  maxUsersPerGym: number;
  features: Record<string, any>;
  isActive?: boolean;
  isPublic?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> {}

export interface SubscriptionPlanResponseDto {
  id: string;
  name: string;
  description?: string;
  price: Record<string, { value: number }>;
  billingFrequency: string;
  duration?: number;
  durationPeriod?: DurationPeriod;
  maxGyms: number;
  maxClientsPerGym: number;
  maxUsersPerGym: number;
  features: Record<string, any>;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  organizationCount: number;
}

// DTOs for Request Management
export interface SubscriptionRequestResponseDto {
  id: string;
  organizationId: string;
  organizationName: string;
  subscriptionPlanId: string;
  subscriptionPlanName: string;
  requestedByName: string;
  status: SubscriptionRequestStatus;
  operationType: SubscriptionOperationType;
  requestedStartDate?: Date;
  notes?: string;
  adminNotes?: string;
  processedByName?: string;
  processedAt?: Date;
  createdAt: Date;
}

export interface ProcessRequestDto {
  status: SubscriptionRequestStatus;
  adminNotes?: string;
  effectiveDate?: string;
}

// DTOs for Operations
export interface SubscriptionOperationResponseDto {
  id: string;
  organizationId: string;
  organizationName: string;
  fromPlanName?: string;
  toPlanName?: string;
  operationType: SubscriptionOperationType;
  executedByName: string;
  effectiveDate: Date;
  previousEndDate?: Date;
  newEndDate?: Date;
  prorationAmount?: number;
  notes?: string;
  createdAt: Date;
}

// DTOs for Cancellations
export interface CancellationResponseDto {
  id: string;
  organizationId: string;
  organizationName: string;
  subscriptionPlanName: string;
  requestedByName: string;
  reason: CancellationReason;
  reasonDescription?: string;
  effectiveDate: Date;
  refundAmount?: number;
  retentionOffered: boolean;
  retentionDetails?: string;
  processedByName?: string;
  processedAt?: Date;
  createdAt: Date;
}

// Analytics DTOs
export enum AnalyticsPeriod {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

export interface SubscriptionAnalyticsQueryDto {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
}

export interface SubscriptionMetricsDto {
  totalActiveSubscriptions: number;
  totalInactiveSubscriptions: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  upgradedSubscriptions: number;
  downgradedSubscriptions: number;
  churnRate: number;
  growthRate: number;
  averageSubscriptionDuration: number;
}

export interface PlanUsageDto {
  planId: string;
  planName: string;
  activeCount: number;
  totalCount: number;
  marketShare: number;
  mrr: number;
}

export interface TrendDataPointDto {
  date: string;
  value: number;
  label?: string;
}

export interface SubscriptionAnalyticsDto {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  metrics: SubscriptionMetricsDto;
  planUsage: PlanUsageDto[];
  growthTrend: TrendDataPointDto[];
  churnTrend: TrendDataPointDto[];
  generatedAt: string;
}

export interface RevenueMetricsDto {
  totalMrr: number;
  totalArr: number;
  newMrr: number;
  churnedMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  netMrrChange: number;
  arpu: number;
  ltv: number;
}

export interface RevenuePlanBreakdownDto {
  planId: string;
  planName: string;
  mrr: number;
  arr: number;
  revenueShare: number;
  activeSubscriptions: number;
  arpu: number;
}

export interface RevenueAnalyticsDto {
  period: string;
  startDate: string;
  endDate: string;
  metrics: RevenueMetricsDto;
  planBreakdown: RevenuePlanBreakdownDto[];
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    growth: number;
  }>;
  generatedAt: string;
}

export interface OrganizationUsageDto {
  organizationId: string;
  organizationName: string;
  planName: string;
  gymCount: number;
  clientCount: number;
  userCount: number;
  utilizationPercentage: number;
  nearingLimits: boolean;
  lastActivityAt: string;
  subscriptionStartDate: string;
}

export interface UsageTrendsDto {
  period: string;
  startDate: string;
  endDate: string;
  organizationUsage: OrganizationUsageDto[];
  utilizationTrend: Array<{
    date: string;
    avgUtilization: number;
    totalOrgs: number;
  }>;
  featureUsage: Array<{
    feature: string;
    usage: number;
    totalEligible: number;
    usagePercentage: number;
  }>;
  nearingLimitsCount: number;
  generatedAt: string;
}

export enum RequestStatusFilter {
  ALL = 'all',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum RequestOperationFilter {
  ALL = 'all',
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  RENEWAL = 'renewal',
  CANCELLATION = 'cancellation',
  ACTIVATION = 'activation',
}

export interface RequestAnalyticsQueryDto {
  status?: RequestStatusFilter;
  operationType?: RequestOperationFilter;
  startDate?: string;
  endDate?: string;
  organizationName?: string;
  page?: number;
  limit?: number;
}

export interface RequestMetricsDto {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  approvalRate: number;
  averageProcessingTime: number;
  stalePendingRequests: number;
}

export interface RequestOperationBreakdownDto {
  operationType: string;
  count: number;
  approvalRate: number;
  avgProcessingTime: number;
}

export interface RequestAnalyticsDto {
  filters: RequestAnalyticsQueryDto;
  metrics: RequestMetricsDto;
  operationBreakdown: RequestOperationBreakdownDto[];
  volumeTrend: Array<{
    date: string;
    requests: number;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  generatedAt: string;
}

export interface SubscriptionHistoryQueryDto {
  operationType?: string;
  organizationName?: string;
  planName?: string;
  page?: number;
  limit?: number;
}

export interface SubscriptionHistoryItemDto {
  id: string;
  organizationId: string;
  organizationName: string;
  fromPlanName?: string;
  toPlanName: string;
  operationType: string;
  executedByName: string;
  effectiveDate: string;
  previousEndDate?: string;
  newEndDate: string;
  prorationAmount?: number;
  notes?: string;
  subscriptionRequestId?: string;
  metadata?: any;
  createdAt: string;
}

export interface SubscriptionHistoryDto {
  data: SubscriptionHistoryItemDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}