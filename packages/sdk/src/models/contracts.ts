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

export type ContractStatus = 'pending' | 'active' | 'expiring_soon' | 'expired' | 'cancelled';

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
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GetContractsParams {
  status?: ContractStatus;
  limit?: number;
  offset?: number;
}