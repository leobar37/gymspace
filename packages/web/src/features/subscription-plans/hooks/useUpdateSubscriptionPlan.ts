import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { UpdateSubscriptionPlanDto, SubscriptionPlanDto } from '@gymspace/sdk';
import { toast } from 'sonner';

export function useUpdateSubscriptionPlan() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation<
    SubscriptionPlanDto,
    Error,
    { id: string; data: UpdateSubscriptionPlanDto }
  >({
    mutationFn: async ({ id, data }) => {
      const plan = await sdk.subscriptionPlans.updatePlan(id, data);
      return plan;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plan', variables.id] });
      toast.success('Subscription plan updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update subscription plan');
    },
  });
}