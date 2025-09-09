import { useMemo, useState, useCallback } from 'react';
import type { Product } from '@gymspace/sdk';

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  status?: 'active' | 'inactive';
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface UseProductsFilterOptions {
  products: Product[];
}

export interface UseProductsFilterReturn {
  filteredProducts: Product[];
  filters: ProductFilters;
  setFilters: (filters: ProductFilters) => void;
  updateFilter: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
}

export function useProductsFilter({ products }: UseProductsFilterOptions): UseProductsFilterReturn {
  const [filters, setFilters] = useState<ProductFilters>({});

  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products.filter((product) => {
      // Search filter - matches name or description
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(searchTerm);
        const matchesDescription = product.description?.toLowerCase().includes(searchTerm);
        
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      // Category filter
      if (filters.categoryId && product.categoryId !== filters.categoryId) {
        return false;
      }

      // Status filter
      if (filters.status && product.status !== filters.status) {
        return false;
      }

      // Stock filter
      if (filters.inStock !== undefined) {
        const hasStock = product.stock !== null && product.stock > 0;
        if (filters.inStock && !hasStock) return false;
        if (!filters.inStock && hasStock) return false;
      }

      // Price range filter
      if (filters.minPrice !== undefined && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
        return false;
      }

      return true;
    });
  }, [products, filters]);

  const updateFilter = useCallback(<K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.categoryId) count++;
    if (filters.status) count++;
    if (filters.inStock !== undefined) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    return count;
  }, [filters]);

  return {
    filteredProducts,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    activeFiltersCount,
  };
}