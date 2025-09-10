import { useGymSdk } from '@/providers/GymSdkProvider';
import { transformPaginatedResponse, type TransformedPaginatedResponse } from '@/utils/pagination';
import type {
  CreateSaleDto,
  Sale,
  SearchSalesParams,
  UpdateSaleDto
} from '@gymspace/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query key factories
export const saleKeys = {
  all: ['sales'] as const,
  lists: () => [...saleKeys.all, 'list'] as const,
  list: (filters?: SearchSalesParams) => [...saleKeys.lists(), filters] as const,
  details: () => [...saleKeys.all, 'detail'] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
  today: () => [...saleKeys.all, 'today'] as const,
};

export interface UseSalesOptions extends SearchSalesParams {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useSales(options: UseSalesOptions = {}) {
  const { sdk } = useGymSdk();
  const {
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 minutes for sales data
    gcTime = 10 * 60 * 1000, // 10 minutes
    ...searchParams
  } = options;

  return useQuery({
    queryKey: saleKeys.list(searchParams),
    queryFn: async (): Promise<TransformedPaginatedResponse<Sale>> => {
      const response = await sdk.sales.searchSales(searchParams);
      return transformPaginatedResponse(response);
    },
    enabled,
    staleTime,
    gcTime,
  });
}

export function useSale(id: string, options: { enabled?: boolean } = {}) {
  const { sdk } = useGymSdk();
  const { enabled = true } = options;

  return useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: async (): Promise<Sale> => {
      return sdk.sales.getSale(id);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useTodaySales(options: { enabled?: boolean } = {}) {
  const { sdk } = useGymSdk();
  const { enabled = true } = options;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return useQuery({
    queryKey: saleKeys.today(),
    queryFn: async (): Promise<Sale[]> => {
      const result = await sdk.sales.searchSales({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
        limit: 1000, // Get all sales for today
        page: 1
      });
      return result.data;
    },
    enabled,
    staleTime: 60 * 1000, // 1 minute for today's sales
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateSale() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSaleDto): Promise<Sale> => {
      return sdk.sales.createSale(data);
    },
    onSuccess: () => {
      // Invalidate and refetch sales lists
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: saleKeys.today() });
    },
  });
}

export function useUpdateSale() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSaleDto }): Promise<Sale> => {
      return sdk.sales.updateSale(id, data);
    },
    onSuccess: (updatedSale) => {
      // Update the specific sale cache
      queryClient.setQueryData(
        saleKeys.detail(updatedSale.id),
        updatedSale
      );
      
      // Invalidate lists to refetch updated data
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: saleKeys.today() });
    },
  });
}

export function useUpdatePaymentStatus() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: 'paid' | 'unpaid' }): Promise<Sale> => {
      return sdk.sales.updatePaymentStatus(id, paymentStatus);
    },
    onSuccess: (updatedSale) => {
      // Update the specific sale cache
      queryClient.setQueryData(
        saleKeys.detail(updatedSale.id),
        updatedSale
      );
      
      // Invalidate lists to refetch updated data
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: saleKeys.today() });
    },
  });
}

export function useDeleteSale() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return sdk.sales.deleteSale(id);
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: saleKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: saleKeys.today() });
    },
  });
}

export function useSalesByCustomer(
  options: { startDate?: string; endDate?: string; enabled?: boolean } = {}
) {
  const { sdk } = useGymSdk();
  const { startDate, endDate, enabled = true } = options;

  return useQuery({
    queryKey: [...saleKeys.all, 'by-customer', startDate, endDate] as const,
    queryFn: async () => {
      return sdk.sales.getSalesByCustomer(startDate, endDate);
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}