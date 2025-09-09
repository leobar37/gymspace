import { useMemo, useState, useCallback } from 'react';
import type { Product } from '@gymspace/sdk';

export interface ServiceFilters {
  search?: string;
  status?: 'active' | 'inactive';
  minPrice?: number;
  maxPrice?: number;
}

export interface UseServicesFilterOptions {
  services: Product[];
}

export interface UseServicesFilterReturn {
  filteredServices: Product[];
  filters: ServiceFilters;
  setFilters: (filters: ServiceFilters) => void;
  updateFilter: <K extends keyof ServiceFilters>(key: K, value: ServiceFilters[K]) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
  searchInput: string;
  setSearchInput: (value: string) => void;
}

export function useServicesFilter({ services }: UseServicesFilterOptions): UseServicesFilterReturn {
  const [filters, setFilters] = useState<ServiceFilters>({});
  const [searchInput, setSearchInput] = useState<string>('');

  const filteredServices = useMemo(() => {
    if (!services || services.length === 0) return [];

    return services.filter((service) => {
      // Search filter - matches name or description
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesName = service.name?.toLowerCase().includes(searchTerm);
        const matchesDescription = service.description?.toLowerCase().includes(searchTerm);
        
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      // Status filter
      if (filters.status && service.status !== filters.status) {
        return false;
      }

      // Price range filter
      if (filters.minPrice !== undefined && service.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && service.price > filters.maxPrice) {
        return false;
      }

      return true;
    });
  }, [services, filters]);

  const updateFilter = useCallback(<K extends keyof ServiceFilters>(
    key: K,
    value: ServiceFilters[K]
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
    if (filters.status) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    return count;
  }, [filters]);

  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value);
    updateFilter('search', value);
  }, [updateFilter]);

  return {
    filteredServices,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    activeFiltersCount,
    searchInput,
    setSearchInput: handleSearchInput,
  };
}