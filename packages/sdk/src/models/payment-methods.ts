import { PaginationQueryDto } from '../types';

export interface CreatePaymentMethodDto {
  name: string;
  description?: string;
  code: string;
  enabled?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentMethodDto {
  name?: string;
  description?: string;
  code?: string;
  enabled?: boolean;
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  code: string;
  enabled: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SearchPaymentMethodsParams extends PaginationQueryDto {
  search?: string;
  enabledOnly?: boolean;
  code?: string;
}

export interface PaymentMethodStats {
  totalPaymentMethods: number;
  enabledPaymentMethods: number;
  disabledPaymentMethods: number;
}