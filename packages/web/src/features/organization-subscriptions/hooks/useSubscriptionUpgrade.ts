'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { UpgradeSubscriptionDto } from '@gymspace/sdk';
import { toast } from 'sonner';

export function useSubscriptionUpgrade(organizationId: string) {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpgradeSubscriptionDto) => {
      return await sdk.adminSubscriptionManagement.upgradeSubscription(organizationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history', organizationId] });
      toast.success('Subscription upgraded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upgrade subscription');
    },
  });
}