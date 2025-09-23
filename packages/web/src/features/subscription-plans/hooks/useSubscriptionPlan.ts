import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { SubscriptionPlanDto } from '@gymspace/sdk';

export function useSubscriptionPlan(planId: string) {
  const { sdk } = useGymSdk();

  return useQuery<SubscriptionPlanDto>({
    queryKey: ['subscription-plan', planId],
    queryFn: async () => {
      const plan = await sdk.subscriptionPlans.getPlan(planId);
      return plan;
    },
    enabled: !!planId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}