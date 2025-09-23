import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { SubscriptionPlanDto } from '@gymspace/sdk';

export function useSubscriptionPlan(planId: string | undefined) {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: ['subscription-plan', planId],
    queryFn: async () => {
      if (!planId) throw new Error('Plan ID is required');

      try {
        const result = await sdk.subscriptionPlans.getPlan(planId);
        return result as SubscriptionPlanDto;
      } catch (err: any) {
        // Enhance error message with status code if available
        if (err.response?.status === 403) {
          throw new Error('403: Forbidden - SUPER_ADMIN permission required');
        } else if (err.response?.status === 401) {
          throw new Error('401: Unauthorized - Please login');
        } else if (err.response?.status === 404) {
          throw new Error('404: Subscription plan not found');
        } else if (err.message === 'Network Error') {
          throw new Error('Network Error - Please check your connection or API configuration');
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
    enabled: !!planId,
  });
}