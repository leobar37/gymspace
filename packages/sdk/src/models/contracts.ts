import { ContractStatus } from '@gymspace/shared';
import { PaginationQueryDto } from '../types';

export interface CreateContractDto {
  gymClientId: string;
  gymMembershipPlanId: string;
  startDate: string;
  discountPercentage?: number;
  customPrice?: number;
  metadata?: Record<string, any>;
}

export interface RenewContractDto {
  startDate?: string;
  discountPercentage?: number;
  customPrice?: number;
  metadata?: Record<string, any>;
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
  startDate: string;
  endDate: string;
  status: ContractStatus;
  price: number;
  discountPercentage?: number;
  finalPrice: number;
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
}

export interface GetContractsParams extends PaginationQueryDto {
  status?: ContractStatus;
}