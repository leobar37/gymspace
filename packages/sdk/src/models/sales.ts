import { PaginationQueryDto } from '@gymspace/shared';

// Sale Item Models
export interface SaleItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    imageId?: string;
    category?: {
      id: string;
      name: string;
      color?: string;
    };
  };
}

// Sale Models
export interface CreateSaleDto {
  items: SaleItemDto[];
  customerName?: string;
  notes?: string;
  paymentStatus?: 'paid' | 'unpaid';
}

export interface UpdateSaleDto {
  customerName?: string;
  notes?: string;
  paymentStatus?: 'paid' | 'unpaid';
}

export interface UpdatePaymentStatusDto {
  paymentStatus: 'paid' | 'unpaid';
}

export interface Sale {
  id: string;
  gymId: string;
  saleNumber: string;
  total: number;
  paymentStatus: 'paid' | 'unpaid';
  saleDate: string;
  customerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  saleItems?: SaleItem[];
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
  _count?: {
    saleItems: number;
  };
}

export interface SearchSalesParams extends PaginationQueryDto {
  customerName?: string;
  paymentStatus?: 'paid' | 'unpaid';
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
}

// Analytics Models
export interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  paidSales: number;
  unpaidSales: number;
  paymentRate: number;
}

export interface TopSellingProduct {
  product?: {
    id: string;
    name: string;
    price: number;
    imageId?: string;
    category?: {
      id: string;
      name: string;
      color?: string;
    };
  };
  totalQuantity: number;
  totalRevenue: number;
}