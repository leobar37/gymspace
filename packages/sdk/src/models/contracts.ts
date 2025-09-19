import { ContractStatus } from '@gymspace/shared';
import { PaginationQueryDto } from '../types';

export interface CreateContractDto {
  gymClientId: string;
  gymMembershipPlanId: string;
  paymentMethodId: string;
  startDate: string;
  discountPercentage?: number;
  customPrice?: number;
  receiptIds?: string[];
  metadata?: Record<string, any>;
}

export interface RenewContractDto {
  startDate?: string;
  discountPercentage?: number;
  customPrice?: number;
  // Payment method ID (UUID) - uses the existing payment method if not provided
  paymentMethodId?: string;
  applyAtEndOfContract?: boolean;
  notes?: string;
  contractDocumentId?: string;
  receiptIds?: string[];
}

export interface FreezeContractDto {
  freezeStartDate: string;
  freezeEndDate: string;
  reason?: string;
}

export interface Contract {
  id: string;
  gymId: string;
  contractNumber: string;
  gymClientId: string;
  gymMembershipPlanId: string;
  paymentMethodId?: string;
  parentId?: string; // Reference to parent contract for renewals
  startDate: string;
  endDate: string;
  status: ContractStatus;
  price: number;
  discountPercentage?: number;
  finalAmount: number;
  freezeStartDate?: string;
  freezeEndDate?: string;
  receiptIds?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Relations
  gymClient?: {
    id: string;
    name: string;
    email: string;
  };
  gymMembershipPlan?: {
    id: string;
    name: string;
    basePrice?: number;
    durationMonths?: number;
  };
  paymentMethod?: {
    id: string;
    name: string;
    description?: string;
    code: string;
    enabled: boolean;
  };
  renewals?: Contract[]; // Renewal contracts for this contract
}

export interface GetContractsParams extends PaginationQueryDto {
  status?: ContractStatus;
  clientName?: string;
  clientId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}