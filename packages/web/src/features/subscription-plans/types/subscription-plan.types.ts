import { SubscriptionPlanDto } from '@gymspace/sdk';

// Re-export SDK types for convenience
export type { SubscriptionPlanDto } from '@gymspace/sdk';

// Local types for form data and UI state
export interface SubscriptionPlanFormData {
  name: string;
  description?: string;
  features: string[];
  maxGyms: number;
  maxCollaboratorsPerGym: number;
  maxClientsPerGym: number;
  pricesPerCountry: Array<{
    country: string;
    price: number;
    currency: string;
  }>;
  isActive: boolean;
}

export interface SubscriptionPlanFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'maxGyms';
  sortDirection?: 'asc' | 'desc';
}

export interface SubscriptionPlanTableColumn {
  key: keyof SubscriptionPlanDto | 'actions';
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}