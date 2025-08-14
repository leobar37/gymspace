export interface CreateMembershipPlanDto {
  name: string;
  description?: string;
  basePrice: number;
  durationMonths?: number;
  durationDays?: number;
  termsAndConditions?: string;
  allowsCustomPricing?: boolean;
  maxEvaluations?: number;
  includesAdvisor?: boolean;
  showInCatalog?: boolean;
  features?: string[];
  status?: 'active' | 'inactive' | 'archived';
  assetsIds?: string[];
}

export interface UpdateMembershipPlanDto {
  name?: string;
  description?: string;
  basePrice?: number;
  durationMonths?: number;
  durationDays?: number;
  termsAndConditions?: string;
  allowsCustomPricing?: boolean;
  maxEvaluations?: number;
  includesAdvisor?: boolean;
  showInCatalog?: boolean;
  features?: string[];
  status?: 'active' | 'inactive' | 'archived';
  isActive?: boolean;
  assetsIds?: string[];
}

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  basePrice: number;
  durationMonths?: number;
  durationDays?: number;
  gym?: {
    id: string;
    name: string;
    organization: {
      currency: string;
    };
  };
  termsAndConditions?: string;
  allowsCustomPricing: boolean;
  maxEvaluations: number;
  includesAdvisor: boolean;
  showInCatalog: boolean;
  features: string[];
  status: 'active' | 'inactive' | 'archived';
  isActive: boolean;
  assetsIds?: string[];
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