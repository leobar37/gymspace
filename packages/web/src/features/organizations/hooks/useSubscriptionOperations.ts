import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { toast } from 'sonner';
import {
  UpgradeSubscriptionDto,
  CancelSubscriptionDto,
  RenewSubscriptionDto,
  CalculateProrationDto,
  ProrationResponseDto,
  UpgradeSubscriptionResponseDto,
  CancelSubscriptionResponseDto,
  RenewSubscriptionResponseDto,
  CancellationReason,
} from '@gymspace/sdk';

// Hook for calculating proration in real-time
export function useProrationCalculation(
  organizationId: string,
  enabled: boolean = false
) {
  const { sdk } = useGymSdk();

  return useQuery<ProrationResponseDto | null>({
    queryKey: ['proration', organizationId],
    queryFn: async () => {
      return null; // Initial state
    },
    enabled: false, // Manual control
    staleTime: 0, // Always fresh
  });
}

// Mutation to calculate proration on-demand
export function useCalculateProration() {
  const { sdk } = useGymSdk();

  return useMutation({
    mutationFn: async ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: CalculateProrationDto;
    }) => {
      // @ts-ignore - SDK types might not be fully aligned
      return await sdk.subscriptionOperations.calculateProration(
        organizationId,
        data
      );
    },
  });
}

// Hook for upgrading subscription
export function useUpgradeSubscription() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation<
    UpgradeSubscriptionResponseDto,
    Error,
    {
      organizationId: string;
      data: UpgradeSubscriptionDto;
    }
  >({
    mutationFn: async ({ organizationId, data }) => {
      // @ts-ignore - SDK types might not be fully aligned
      return await sdk.subscriptionOperations.upgradeSubscription(
        organizationId,
        data
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({
        queryKey: ['organization', variables.organizationId],
      });
      
      toast.success('Subscription upgraded successfully', {
        description: `Upgraded to ${data.newSubscription.planName}`,
      });
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to upgrade subscription';
      
      if (errorMessage.includes('usage')) {
        toast.error('Cannot upgrade subscription', {
          description: 'Current usage exceeds new plan limits. Please reduce usage first.',
        });
      } else if (errorMessage.includes('payment')) {
        toast.error('Payment required', {
          description: 'Please update payment method to proceed with upgrade.',
        });
      } else {
        toast.error('Upgrade failed', {
          description: errorMessage,
        });
      }
    },
  });
}

// Hook for downgrading subscription
export function useDowngradeSubscription() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation<
    UpgradeSubscriptionResponseDto,
    Error,
    {
      organizationId: string;
      data: UpgradeSubscriptionDto;
    }
  >({
    mutationFn: async ({ organizationId, data }) => {
      // @ts-ignore - SDK types might not be fully aligned
      return await sdk.subscriptionOperations.downgradeSubscription(
        organizationId,
        data
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({
        queryKey: ['organization', variables.organizationId],
      });
      
      toast.success('Subscription downgraded successfully', {
        description: `Changed to ${data.newSubscription.planName}`,
      });
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to downgrade subscription';
      
      if (errorMessage.includes('usage')) {
        toast.error('Cannot downgrade subscription', {
          description: 'Current usage exceeds target plan limits. Please reduce usage first.',
        });
      } else {
        toast.error('Downgrade failed', {
          description: errorMessage,
        });
      }
    },
  });
}

// Hook for canceling subscription
export function useCancelSubscription() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation<
    CancelSubscriptionResponseDto,
    Error,
    {
      organizationId: string;
      data: CancelSubscriptionDto;
    }
  >({
    mutationFn: async ({ organizationId, data }) => {
      // @ts-ignore - SDK types might not be fully aligned
      return await sdk.subscriptionOperations.cancelSubscription(
        organizationId,
        data
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({
        queryKey: ['organization', variables.organizationId],
      });
      
      const message = data.cancellation.refundAmount
        ? `Subscription cancelled. Refund of $${data.cancellation.refundAmount.toFixed(2)} will be processed.`
        : `Subscription will be cancelled on ${new Date(data.effectiveDate).toLocaleDateString()}`;
      
      toast.success('Cancellation confirmed', {
        description: message,
      });
    },
    onError: (error) => {
      toast.error('Cancellation failed', {
        description: error.message || 'Failed to cancel subscription',
      });
    },
  });
}

// Hook for renewing subscription
export function useRenewSubscription() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation<
    RenewSubscriptionResponseDto,
    Error,
    {
      organizationId: string;
      data: RenewSubscriptionDto;
    }
  >({
    mutationFn: async ({ organizationId, data }) => {
      // @ts-ignore - SDK types might not be fully aligned
      return await sdk.subscriptionOperations.renewSubscription(
        organizationId,
        data
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({
        queryKey: ['organization', variables.organizationId],
      });
      
      toast.success('Subscription renewed successfully', {
        description: `Active until ${new Date(data.newSubscription.endDate).toLocaleDateString()}`,
      });
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to renew subscription';
      
      if (errorMessage.includes('payment')) {
        toast.error('Payment required', {
          description: 'Please update payment method to proceed with renewal.',
        });
      } else if (errorMessage.includes('expired')) {
        toast.error('Subscription expired', {
          description: 'This subscription has expired and cannot be renewed. Please contact support.',
        });
      } else {
        toast.error('Renewal failed', {
          description: errorMessage,
        });
      }
    },
  });
}

// Combined hook for plan change (upgrade or downgrade)
export function usePlanChange() {
  const upgradeSubscription = useUpgradeSubscription();
  const downgradeSubscription = useDowngradeSubscription();
  const calculateProration = useCalculateProration();

  const executePlanChange = async (
    organizationId: string,
    currentPlanPrice: number,
    newPlanPrice: number,
    data: UpgradeSubscriptionDto
  ) => {
    const isUpgrade = newPlanPrice > currentPlanPrice;
    
    if (isUpgrade) {
      return upgradeSubscription.mutateAsync({ organizationId, data });
    } else {
      return downgradeSubscription.mutateAsync({ organizationId, data });
    }
  };

  return {
    executePlanChange,
    calculateProration,
    isLoading: upgradeSubscription.isPending || downgradeSubscription.isPending,
    isCalculating: calculateProration.isPending,
  };
}

// Utility hook for cancellation reasons
export function useCancellationReasons() {
  const reasons: Array<{ value: CancellationReason; label: string; description: string }> = [
    {
      value: 'cost_too_high',
      label: 'Cost too high',
      description: 'The subscription price is beyond our budget',
    },
    {
      value: 'feature_limitations',
      label: 'Missing features',
      description: 'The platform lacks features we need',
    },
    {
      value: 'switching_providers',
      label: 'Switching providers',
      description: 'We are moving to a different platform',
    },
    {
      value: 'business_closure',
      label: 'Business closure',
      description: 'Our business is closing or restructuring',
    },
    {
      value: 'technical_issues',
      label: 'Technical issues',
      description: 'Experiencing ongoing technical problems',
    },
    {
      value: 'poor_support',
      label: 'Poor support',
      description: 'Customer support did not meet expectations',
    },
    {
      value: 'other',
      label: 'Other reason',
      description: 'Another reason not listed above',
    },
  ];

  return reasons;
}