import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { toast } from 'sonner';

export function useDeleteSubscriptionPlan() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (planId: string) => {
      const result = await sdk.subscriptionPlans.deletePlan(planId);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Subscription plan deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete subscription plan');
    },
  });
}