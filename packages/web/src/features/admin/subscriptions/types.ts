export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  type: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
  pricing: PricingOption[];
  limits: PlanLimits;
  features: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingOption {
  amount: number;
  currency: string;
  interval?: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
}

export interface PlanLimits {
  gyms: number; // -1 for unlimited
  clients: number; // -1 for unlimited
  users: number; // -1 for unlimited
  storage?: number; // in GB, -1 for unlimited
  customFields?: number;
}

export interface CreatePlanDto {
  name: string;
  description?: string;
  type: string;
  pricing: PricingOption[];
  limits: PlanLimits;
  features: string[];
  isPublic: boolean;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> {}

export interface SubscriptionRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  planId: string;
  planName: string;
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: Date;
  processedDate?: Date;
  processedBy?: string;
  notes?: string;
}

export interface ProcessRequestDto {
  action: 'APPROVE' | 'REJECT';
  notes?: string;
}

export interface SubscriptionOperation {
  id: string;
  type: 'ACTIVATION' | 'RENEWAL' | 'CANCELLATION' | 'UPGRADE' | 'DOWNGRADE';
  organizationId: string;
  organizationName: string;
  planId: string;
  planName: string;
  performedBy: string;
  performedAt: Date;
  details: Record<string, any>;
}

export interface SubscriptionCancellation {
  id: string;
  organizationId: string;
  organizationName: string;
  planId: string;
  planName: string;
  reason: string;
  feedback?: string;
  requestedAt: Date;
  effectiveDate: Date;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}