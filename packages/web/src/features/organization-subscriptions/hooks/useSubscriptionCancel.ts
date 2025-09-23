'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { CancelSubscriptionDto } from '@gymspace/sdk';
import { toast } from 'sonner';

export function useSubscriptionCancel(organizationId: string) {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CancelSubscriptionDto) => {
      return await sdk.adminSubscriptionManagement.cancelSubscription(organizationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history', organizationId] });
      toast.success('Subscription cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });
}