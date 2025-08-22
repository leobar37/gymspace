export interface SubscriptionPlan {
  id: string;
  name: string;
  price: any;
  billingFrequency: string;
  maxGyms: number;
  maxClientsPerGym: number;
  maxUsersPerGym: number;
  features: any;
  description?: string;
}

export interface Subscription {
  id: string;
  organizationId: string;
  subscriptionPlanId: string;
  subscriptionPlan?: SubscriptionPlan;
  status: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface AvailablePlanDto {
  id: string;
  name: string;
  description?: string;
  price: any;
  billingFrequency: string;
  maxGyms: number;
  maxClientsPerGym: number;
  maxUsersPerGym: number;
  features: any;
  isFreePlan: boolean;
}

export interface SubscriptionStatusDto {
  organizationId: string;
  currentPlan: SubscriptionPlan | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  usage: {
    gyms: {
      current: number;
      limit: number;
    };
    clientsPerGym: {
      [gymId: string]: {
        current: number;
        limit: number;
      };
    };
    usersPerGym: {
      [gymId: string]: {
        current: number;
        limit: number;
      };
    };
  };
  canUpgrade: boolean;
  canDowngrade: boolean;
}

export interface AffiliateOrganizationDto {
  subscriptionPlanId: string;
}

export interface CheckLimitResponse {
  canPerform: boolean;
  currentUsage: number;
  limit: number;
  message?: string;
}