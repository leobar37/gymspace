'use client';

import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';

export function useSubscriptionHistory(organizationId: string, enabled: boolean = true) {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: ['subscription-history', organizationId],
    queryFn: async () => {
      return await sdk.adminSubscriptionManagement.getSubscriptionHistory(organizationId);
    },
    enabled: !!organizationId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}