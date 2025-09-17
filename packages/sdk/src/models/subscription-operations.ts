// ===============================
// UPGRADE SUBSCRIPTION TYPES
// ===============================

export interface UpgradeSubscriptionDto {
  newPlanId: string;
  effectiveDate?: string;
  immediate?: boolean;
  prorationEnabled?: boolean;
}

export interface ProrationDetails {
  remainingDays: number;
  totalDays: number;
  unusedPercentage: number;
  currentPlanPrice: number;
  newPlanPrice: number;
  creditAmount: number;
  chargeAmount: number;
  netAmount: number;
  description: string;
}

export interface SubscriptionDetails {
  id: string;
  planId: string;
  planName: string;
  startDate?: string;
  endDate: string;
  status?: string;
}

export interface UpgradeSubscriptionResponseDto {
  success: boolean;
  effectiveDate: string;
  oldSubscription: SubscriptionDetails;
  newSubscription: SubscriptionDetails & { startDate: string };
  proration?: ProrationDetails;
  operationId: string;
}

// ===============================
// CANCELLATION TYPES
// ===============================

export type CancellationReason = 
  | 'cost_too_high'
  | 'feature_limitations'
  | 'switching_providers'
  | 'business_closure'
  | 'technical_issues'
  | 'poor_support'
  | 'other';

export interface CancelSubscriptionDto {
  reason: CancellationReason;
  reasonDescription?: string;
  effectiveDate?: string;
  immediate?: boolean;
  refundEnabled?: boolean;
  retentionOffered?: boolean;
  retentionDetails?: string;
}

export interface CancellationDetails {
  id: string;
  reason: CancellationReason;
  reasonDescription?: string;
  refundAmount?: number;
  retentionOffered: boolean;
  retentionDetails?: string;
}

export interface CancelSubscriptionResponseDto {
  success: boolean;
  effectiveDate: string;
  subscription: SubscriptionDetails;
  cancellation: CancellationDetails;
  refundAmount?: number;
}

// ===============================
// RENEWAL TYPES
// ===============================

export interface RenewSubscriptionDto {
  planId?: string;
  duration?: number;
  durationPeriod?: 'DAY' | 'MONTH';
  effectiveDate?: string;
  extendCurrent?: boolean;
}

export interface RenewSubscriptionResponseDto {
  success: boolean;
  effectiveDate: string;
  oldSubscription: SubscriptionDetails;
  newSubscription: SubscriptionDetails & { startDate: string };
  operationId: string;
}

// ===============================
// PRORATION CALCULATION TYPES
// ===============================

export interface CalculateProrationDto {
  newPlanId: string;
  effectiveDate?: string;
}

export interface ProrationResponseDto {
  remainingDays: number;
  totalDays: number;
  unusedPercentage: number;
  currentPlanPrice: number;
  newPlanPrice: number;
  creditAmount: number;
  chargeAmount: number;
  netAmount: number;
  description: string;
  currency: string;
}

// ===============================
// ENHANCED ORGANIZATION TYPES
// ===============================

export interface OrganizationBasicInfo {
  id: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  createdAt: string;
}

export interface CurrentSubscription {
  id: string;
  planId: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  isExpiring: boolean;
  isExpired: boolean;
  daysUntilExpiration: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: Record<string, number>;
  billingFrequency: string;
  maxGyms: number;
  maxClientsPerGym: number;
  maxUsersPerGym: number;
  features: any;
}

export interface UsageStatistics {
  gyms: {
    current: number;
    limit: number;
    percentage: number;
  };
  clients: {
    current: number;
    limit: number;
    percentage: number;
  };
  collaborators: {
    current: number;
    limit: number;
    percentage: number;
  };
}

export interface BillingInformation {
  renewalWindow: {
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  nextBillingDate?: string;
  canRenew: boolean;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

export interface SubscriptionOperation {
  id: string;
  operationType: string;
  effectiveDate: string;
  fromPlanName?: string;
  toPlanName?: string;
  prorationAmount?: number;
  createdAt: string;
}

export interface OrganizationGym {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
  clientsCount: number;
  collaboratorsCount: number;
}

export interface OrganizationSubscriptionDetailsDto {
  organization: OrganizationBasicInfo;
  currentSubscription: CurrentSubscription | null;
  plan: SubscriptionPlan | null;
  usage: UsageStatistics | null;
  billing: BillingInformation | null;
  recentOperations?: SubscriptionOperation[];
  gyms: OrganizationGym[];
}

// ===============================
// ENHANCED LIST ORGANIZATIONS TYPES
// ===============================

export interface OrganizationOwner {
  id: string;
  email: string;
  fullName: string;
}

export interface OrganizationGymSummary {
  id: string;
  name: string;
  address: string;
}

export interface OrganizationLocale {
  country: string;
  currency: string;
  timezone: string;
}

export interface OrganizationSubscriptionSummary {
  id: string;
  planId: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  isExpiring: boolean;
  isExpired: boolean;
  daysUntilExpiration: number;
}

export interface OrganizationUsageSummary {
  gyms: {
    current: number;
    limit: number;
    percentage: number;
  };
  clients: {
    current: number;
    limit: number;
    percentage: number;
  };
  collaborators: {
    current: number;
    limit: number;
    percentage: number;
  };
}

export interface OrganizationWithEnhancedDetails {
  id: string;
  name: string;
  owner: OrganizationOwner;
  gyms: OrganizationGymSummary[];
  createdAt: Date;
  subscription?: OrganizationSubscriptionSummary;
  usage?: OrganizationUsageSummary;
  locale?: OrganizationLocale;
}

// ===============================
// UTILITY TYPES
// ===============================

export interface SubscriptionOperationRequest {
  organizationId: string;
  requestType: 'upgrade' | 'downgrade' | 'renewal' | 'cancellation';
  planId?: string;
  effectiveDate?: string;
  immediate?: boolean;
  reason?: CancellationReason;
  notes?: string;
}

export interface SubscriptionOperationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
  estimatedCost?: number;
  estimatedRefund?: number;
}

export interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiringSoon: number;
  expired: number;
  cancelledThisMonth: number;
  upgradesThisMonth: number;
  totalRevenue: number;
  averageRevenuePerOrganization: number;
}