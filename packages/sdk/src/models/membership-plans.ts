export interface CreateMembershipPlanDto {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  durationMonths: number;
  termsAndConditions?: string;
  allowsCustomPricing?: boolean;
  maxEvaluations?: number;
  includesAdvisor?: boolean;
  showInCatalog?: boolean;
  features?: string[];
  status?: 'active' | 'inactive' | 'archived';
}

export interface UpdateMembershipPlanDto {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  durationMonths?: number;
  termsAndConditions?: string;
  allowsCustomPricing?: boolean;
  maxEvaluations?: number;
  includesAdvisor?: boolean;
  showInCatalog?: boolean;
  features?: string[];
  status?: 'active' | 'inactive' | 'archived';
  isActive?: boolean;
}

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationMonths: number;
  termsAndConditions?: string;
  allowsCustomPricing: boolean;
  maxEvaluations: number;
  includesAdvisor: boolean;
  showInCatalog: boolean;
  features: string[];
  status: 'active' | 'inactive' | 'archived';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlanStats {
  totalContracts: number;
  activeContracts: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface GetMembershipPlansParams {
  activeOnly?: boolean;
}