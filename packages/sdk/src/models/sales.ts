import { PaginationQueryDto } from '../types';

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
  customerId?: string;
  customerName?: string;
  notes?: string;
  fileIds?: string[];
  paymentStatus?: 'paid' | 'unpaid';
  paymentMethodId?: string;
}

export interface UpdateSaleDto {
  customerId?: string;
  customerName?: string;
  notes?: string;
  fileIds?: string[];
  paymentStatus?: 'paid' | 'unpaid';
  paymentMethodId?: string;
}

export interface UpdatePaymentStatusDto {
  paymentStatus: 'paid' | 'unpaid';
}

export interface Sale {
  id: string;
  gymId: string;
  customerId?: string;
  saleNumber: string;
  total: number;
  paymentStatus: 'paid' | 'unpaid';
  paymentMethodId?: string;
  saleDate: string;
  customerName?: string;
  notes?: string;
  fileIds?: string[];
  createdAt: string;
  updatedAt: string;
  saleItems?: SaleItem[];
  customer?: {
    id: string;
    clientNumber: string;
    name: string;
    phone?: string;
    email?: string;
  };
  paymentMethod?: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
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
  customerId?: string;
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

export interface CustomerSalesReport {
  summary: {
    totalCustomers: number;
    totalSales: number;
    totalRevenue: number;
  };
  customers: Array<{
    customer: {
      id: string | null;
      clientNumber?: string;
      name: string;
      phone?: string;
      email?: string;
    };
    totalSales: number;
    totalRevenue: number;
    sales: Array<{
      id: string;
      total: number;
      saleDate: string;
    }>;
  }>;
}