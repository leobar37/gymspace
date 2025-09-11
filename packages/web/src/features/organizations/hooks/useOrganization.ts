import { useGymSdk } from '@/providers/GymSdkProvider';
import { useQuery } from '@tanstack/react-query';

const QUERY_KEYS = {
  organizationById: (id: string) => ['organization', id],
  organizationStats: (id: string) => ['organization', id, 'stats'],
};

/**
 * Hook to fetch a single organization by ID
 */
export const useOrganization = (organizationId: string) => {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: QUERY_KEYS.organizationById(organizationId),
    queryFn: () => sdk.organizations.getOrganization(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch organization statistics
 */
export const useOrganizationStats = (organizationId: string) => {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: QUERY_KEYS.organizationStats(organizationId),
    queryFn: () => sdk.organizations.getOrganizationStats(organizationId),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};