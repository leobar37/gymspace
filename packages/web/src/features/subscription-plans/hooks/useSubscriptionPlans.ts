import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { SubscriptionPlanDto } from '@gymspace/sdk';

export function useSubscriptionPlans() {
  const { sdk } = useGymSdk();

  return useQuery<SubscriptionPlanDto[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const plans = await sdk.subscriptionPlans.listPlans();
      return plans;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}