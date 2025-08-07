import { PaginationQueryDto } from '@gymspace/shared';

// Supplier Models
export interface CreateSupplierDto {
  name: string;
  contactInfo?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  contactInfo?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Supplier {
  id: string;
  gymId: string;
  name: string;
  contactInfo?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SearchSuppliersParams extends PaginationQueryDto {
  search?: string;
}

// Analytics Models
export interface SuppliersStats {
  totalSuppliers: number;
  suppliersWithEmail: number;
  suppliersWithPhone: number;
  suppliersWithAddress: number;
  contactCompleteness: {
    email: number;
    phone: number;
    address: number;
  };
}