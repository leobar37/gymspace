import { PaginationQueryDto } from '../types';

// Product Category Models
export interface CreateProductCategoryDto {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProductCategoryDto {
  name?: string;
  description?: string;
  color?: string;
}

export interface ProductCategory {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  color?: string;
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
  _count?: {
    products: number;
  };
}

// Product Models
export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  categoryId?: string;
  imageId?: string;
  status?: 'active' | 'inactive';
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  imageId?: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  imageId?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateStockDto {
  quantity: number;
  notes?: string;
  supplierId?: string;
  fileId?: string;
}

export interface Product {
  id: string;
  gymId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  stock: number | null;
  imageId?: string;
  status: 'active' | 'inactive';
  type?: 'Product' | 'Service';
  trackInventory?: 'none' | 'simple' | 'advanced' | 'capacity';
  createdAt: string;
  updatedAt: string;
  category?: ProductCategory;
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

export interface SearchProductsParams extends PaginationQueryDto {
  search?: string;
  categoryId?: string;
  type?: 'Product' | 'Service';
  status?: 'active' | 'inactive';
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

// Stock Movement Models
export interface StockMovement {
  id: string;
  productId: string;
  gymId: string;
  type: 'manual_entry' | 'sale' | 'return' | 'adjustment' | 'initial_stock';
  quantity: number;
  previousStock?: number;
  newStock?: number;
  notes?: string;
  supplierId?: string;
  fileId?: string;
  createdByUserId: string;
  createdAt: string;
  product?: Product;
  supplier?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}