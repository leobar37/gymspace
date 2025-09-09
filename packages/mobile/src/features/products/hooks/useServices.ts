import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import type { Product } from '@gymspace/sdk';

// Query key factories for services
export const serviceKeys = {
  all: ['services'] as const,
  list: () => [...serviceKeys.all, 'list'] as const,
};

export interface UseServicesOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

// Shared configuration for services list
const SERVICES_LIST_CONFIG = {
  page: 1,
  limit: 1000,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
} as const;

// Shared query function for fetching services
const createServicesQueryFn = (sdk: ReturnType<typeof useGymSdk>['sdk']) => {
  return async (): Promise<Product[]> => {
    const response = await sdk.products.searchProducts({ 
      type: 'Service',
      page: SERVICES_LIST_CONFIG.page, 
      limit: SERVICES_LIST_CONFIG.limit 
    });
    return response.data || [];
  };
};

export function useServices(options: UseServicesOptions = {}) {
  const { sdk } = useGymSdk();
  const {
    enabled = true,
    staleTime = SERVICES_LIST_CONFIG.staleTime,
    gcTime = SERVICES_LIST_CONFIG.gcTime,
  } = options;

  return useQuery({
    queryKey: serviceKeys.list(),
    queryFn: createServicesQueryFn(sdk),
    enabled,
    staleTime,
    gcTime,
  });
}

// Prefetch function for services
export function usePrefetchServices() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.prefetchQuery({
      queryKey: serviceKeys.list(),
      queryFn: createServicesQueryFn(sdk),
      staleTime: SERVICES_LIST_CONFIG.staleTime,
    });
  };
}