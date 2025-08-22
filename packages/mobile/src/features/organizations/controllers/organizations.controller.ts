import { useGymSdk } from '@/providers/GymSdkProvider';
import { UpdateOrganizationDto } from '@gymspace/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  organizationById: (id: string) => ['organization', id],
  organizationStats: (id: string) => ['organization', id, 'stats'],
};

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

export const useUpdateOrganization = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOrganizationDto }) => {
      return sdk.organizations.updateOrganization(id, data);
    },
    onSuccess: (updatedOrganization) => {
      // Update cache
      queryClient.setQueryData(
        QUERY_KEYS.organizationById(updatedOrganization.id),
        updatedOrganization
      );
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.organizationStats(updatedOrganization.id) 
      });
      // Also refetch session to update organization data
      queryClient.invalidateQueries({ queryKey: ['session', 'current'] });
    },
    onError: (error: any) => {
      console.error('Error updating organization:', error);
    },
  });
};