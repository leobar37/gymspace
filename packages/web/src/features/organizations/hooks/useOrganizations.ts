import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';

export interface OrganizationWithDetails {
  id: string;
  name: string;
  owner: {
    id: string;
    email: string;
    fullName: string;
  };
  gyms: {
    id: string;
    name: string;
    address: string;
  }[];
  createdAt: Date;
}

export function useOrganizations() {
  const { sdk } = useGymSdk();
  
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      try {
        const result = await sdk.organizations.listOrganizations();
        return result as OrganizationWithDetails[];
      } catch (err: any) {
        // Enhance error message with status code if available
        if (err.response?.status === 403) {
          throw new Error('403: Forbidden - SUPER_ADMIN permission required');
        } else if (err.response?.status === 401) {
          throw new Error('401: Unauthorized - Please login');
        } else if (err.message === 'Network Error') {
          throw new Error('Network Error - Please check your connection or API configuration');
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on permission errors
      if (error.message?.includes('403') || error.message?.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}