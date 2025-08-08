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
}

export interface Product {
  id: string;
  gymId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageId?: string;
  status: 'active' | 'inactive';
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
  status?: 'active' | 'inactive';
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}