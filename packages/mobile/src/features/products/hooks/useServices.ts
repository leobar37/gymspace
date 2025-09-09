import { useQuery } from '@tanstack/react-query';
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

export function useServices(options: UseServicesOptions = {}) {
  const { sdk } = useGymSdk();
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  return useQuery({
    queryKey: serviceKeys.list(),
    queryFn: async (): Promise<Product[]> => {
      // Load up to 100 services without pagination
      const response = await sdk.products.searchProducts({ 
        type: 'Service',
        page: 1, 
        limit: 100 
      });
      return response.data || [];
    },
    enabled,
    staleTime,
    gcTime,
  });
}