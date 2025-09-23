import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { OrganizationAdminDetails } from '@gymspace/sdk';

export function useOrganizationDetails(organizationId: string) {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: ['organization-admin-details', organizationId],
    queryFn: async () => {
      try {
        const result = await sdk.organizations.getOrganizationForAdmin(organizationId);
        return result as OrganizationAdminDetails;
      } catch (err: any) {
        // Enhance error message with status code if available
        if (err.response?.status === 403) {
          throw new Error('403: Forbidden - SUPER_ADMIN permission required');
        } else if (err.response?.status === 401) {
          throw new Error('401: Unauthorized - Please login');
        } else if (err.response?.status === 404) {
          throw new Error('404: Organization not found');
        } else if (err.message === 'Network Error') {
          throw new Error('Network Error - Please check your connection or API configuration');
        }
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on permission or not found errors
      if (
        error.message?.includes('403') ||
        error.message?.includes('401') ||
        error.message?.includes('404')
      ) {
        return false;
      }
      return failureCount < 3;
    },
    enabled: !!organizationId,
  });
}