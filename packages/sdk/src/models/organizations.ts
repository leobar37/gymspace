export interface UpdateOrganizationDto {
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  country?: string;
  currency?: string;
  timezone?: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationStats {
  totalGyms: number;
  totalClients: number;
  totalContracts: number;
  activeContracts: number;
  totalRevenue: number;
}

export interface OrganizationWithDetails {
  id: string;
  name: string;
  owner: {
    id: string;
    email: string;
    fullName: string;
  };
  gyms: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  subscription?: {
    planName: string;
    status: string; // Should match SubscriptionStatus enum
    startDate: Date;
    endDate: Date;
    isExpired: boolean;
  };
  createdAt: Date;
}

export interface OrganizationAdminDetails {
  id: string;
  name: string;
  country?: string;
  currency?: string;
  timezone?: string;
  settings?: Record<string, any>;
  owner: {
    id: string;
    email: string;
    fullName: string;
  };
  gyms: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  subscription?: {
    id: string;
    planName: string;
    status: string; // Should match SubscriptionStatus enum
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    isExpired: boolean;
    daysRemaining: number;
    metadata?: Record<string, any>;
  };
  stats: {
    totalGyms: number;
    totalClients: number;
    totalContracts: number;
    activeContracts: number;
    totalRevenue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}