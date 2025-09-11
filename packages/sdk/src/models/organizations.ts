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
  createdAt: Date;
}