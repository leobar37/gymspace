import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { CreateSubscriptionPlanDto, SubscriptionPlanDto } from '@gymspace/sdk';
import { toast } from 'sonner';

export function useCreateSubscriptionPlan() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation<SubscriptionPlanDto, Error, CreateSubscriptionPlanDto>({
    mutationFn: async (data: CreateSubscriptionPlanDto) => {
      const plan = await sdk.subscriptionPlans.createPlan(data);
      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Subscription plan created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create subscription plan');
    },
  });
}