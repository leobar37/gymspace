export interface Organization {
  id: string;
  name: string;
  country?: string;
  currency?: string;
  timezone?: string;
  settings?: Record<string, any>;
}

export interface OrganizationStats {
  totalGyms: number;
  totalClients: number;
  totalContracts: number;
  activeContracts: number;
}

export interface OrganizationUpdateData {
  name: string;
}