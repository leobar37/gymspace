'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { ActivateRenewalDto } from '@gymspace/sdk';
import { toast } from 'sonner';

export function useSubscriptionRenewal(organizationId: string) {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ActivateRenewalDto) => {
      return await sdk.adminSubscriptionManagement.activateRenewal(organizationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history', organizationId] });
      toast.success('Subscription renewed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to renew subscription');
    },
  });
}