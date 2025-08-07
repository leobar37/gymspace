import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { transformPaginatedResponse, type TransformedPaginatedResponse } from '@/utils/pagination';
import type { 
  Supplier, 
  CreateSupplierDto,
  UpdateSupplierDto,
  SearchSuppliersParams,
  PaginatedResponseDto 
} from '@gymspace/sdk';

// Query key factories
export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters?: SearchSuppliersParams) => [...supplierKeys.lists(), filters] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
};

export interface UseSuppliersOptions extends SearchSuppliersParams {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useSuppliers(options: UseSuppliersOptions = {}) {
  const { sdk } = useGymSdk();
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
    ...searchParams
  } = options;

  return useQuery({
    queryKey: supplierKeys.list(searchParams),
    queryFn: async (): Promise<TransformedPaginatedResponse<Supplier>> => {
      const response = await sdk.suppliers.searchSuppliers(searchParams);
      return transformPaginatedResponse(response);
    },
    enabled,
    staleTime,
    gcTime,
  });
}

export function useSupplier(id: string, options: { enabled?: boolean } = {}) {
  const { sdk } = useGymSdk();
  const { enabled = true } = options;

  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: async (): Promise<Supplier> => {
      return sdk.suppliers.getSupplier(id);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateSupplier() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSupplierDto): Promise<Supplier> => {
      return sdk.suppliers.createSupplier(data);
    },
    onSuccess: () => {
      // Invalidate and refetch supplier lists
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}

export function useUpdateSupplier() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierDto }): Promise<Supplier> => {
      return sdk.suppliers.updateSupplier(id, data);
    },
    onSuccess: (updatedSupplier) => {
      // Update the specific supplier cache
      queryClient.setQueryData(
        supplierKeys.detail(updatedSupplier.id),
        updatedSupplier
      );
      
      // Invalidate lists to refetch updated data
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}

export function useDeleteSupplier() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return sdk.suppliers.deleteSupplier(id);
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: supplierKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}