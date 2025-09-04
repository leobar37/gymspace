import { useGymSdk } from '@/providers/GymSdkProvider';
import type {
  CreatePaymentMethodDto,
  SearchPaymentMethodsParams,
  UpdatePaymentMethodDto
} from '@gymspace/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query keys
export const paymentMethodsKeys = {
  all: ['payment-methods'] as const,
  lists: () => [...paymentMethodsKeys.all, 'list'] as const,
  list: (filters: any) => [...paymentMethodsKeys.lists(), { filters }] as const,
  details: () => [...paymentMethodsKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentMethodsKeys.details(), id] as const,
  stats: () => [...paymentMethodsKeys.all, 'stats'] as const,
};

// Re-export SDK types
export type { CreatePaymentMethodDto, PaymentMethod, UpdatePaymentMethodDto } from '@gymspace/sdk';

// Form data type for internal use (matches form schema)
export interface PaymentMethodFormData {
  name: string;
  description?: string;
  code: string;
  enabled?: boolean;
  metadata?: Record<string, any>;
}

export interface SearchFilters extends SearchPaymentMethodsParams {}

export const usePaymentMethodsController = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  // Get payment methods list
  const usePaymentMethodsList = (filters: SearchFilters = {}) => {
    return useQuery({
      queryKey: paymentMethodsKeys.list(filters),
      queryFn: async () => {
        const response = await sdk.paymentMethods.searchPaymentMethods({
          ...filters,
          page: filters.page || 1,
          limit: filters.limit || 20,
        });
        return response;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Get payment method details
  const usePaymentMethodDetail = (paymentMethodId: string | undefined) => {
    return useQuery({
      queryKey: paymentMethodId ? paymentMethodsKeys.detail(paymentMethodId) : ['payment-method-detail-empty'],
      queryFn: async () => {
        if (!paymentMethodId) return null;
        const response = await sdk.paymentMethods.getPaymentMethod(paymentMethodId);
        return response;
      },
      enabled: !!paymentMethodId && paymentMethodId.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get payment methods stats
  const usePaymentMethodsStats = () => {
    return useQuery({
      queryKey: paymentMethodsKeys.stats(),
      queryFn: async () => {
        const response = await sdk.paymentMethods.getPaymentMethodStats();
        return response;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Create payment method mutation
  const createPaymentMethodMutation = useMutation({
    mutationFn: async (data: CreatePaymentMethodDto) => {
      const response = await sdk.paymentMethods.createPaymentMethod(data);
      return response;
    },
    onSuccess: () => {
      // Invalidate payment methods list to refetch
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.stats() });
    },
  });

  // Update payment method mutation
  const updatePaymentMethodMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePaymentMethodDto }) => {
      const response = await sdk.paymentMethods.updatePaymentMethod(id, data);
      return response;
    },
    onSuccess: (data, variables) => {
      // Update cache for this payment method
      queryClient.setQueryData(paymentMethodsKeys.detail(variables.id), data);
      // Invalidate list to show updated data
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.stats() });
    },
  });

  // Toggle payment method status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await sdk.paymentMethods.togglePaymentMethod(paymentMethodId);
      return response;
    },
    onSuccess: (data, paymentMethodId) => {
      // Update payment method detail cache
      queryClient.setQueryData(paymentMethodsKeys.detail(paymentMethodId), data);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.stats() });
    },
  });

  // Delete payment method mutation
  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      await sdk.paymentMethods.deletePaymentMethod(paymentMethodId);
    },
    onSuccess: (_, paymentMethodId) => {
      queryClient.removeQueries({ queryKey: paymentMethodsKeys.detail(paymentMethodId) });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.stats() });
    },
  });

  // Prefetch payment method data
  const prefetchPaymentMethod = async (paymentMethodId: string) => {
    await queryClient.prefetchQuery({
      queryKey: paymentMethodsKeys.detail(paymentMethodId),
      queryFn: async () => {
        const response = await sdk.paymentMethods.getPaymentMethod(paymentMethodId);
        return response;
      },
    });
  };

  return {
    // Query hooks
    usePaymentMethodsList,
    usePaymentMethodDetail,
    usePaymentMethodsStats,

    // Mutations
    createPaymentMethod: createPaymentMethodMutation.mutate,
    isCreatingPaymentMethod: createPaymentMethodMutation.isPending,
    createPaymentMethodError: createPaymentMethodMutation.error,

    updatePaymentMethod: updatePaymentMethodMutation.mutate,
    isUpdatingPaymentMethod: updatePaymentMethodMutation.isPending,

    toggleStatus: toggleStatusMutation.mutate,
    isTogglingStatus: toggleStatusMutation.isPending,

    deletePaymentMethod: deletePaymentMethodMutation.mutate,
    isDeletingPaymentMethod: deletePaymentMethodMutation.isPending,

    // Utilities
    prefetchPaymentMethod,
    invalidatePaymentMethods: () => queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.all }),
  };
};