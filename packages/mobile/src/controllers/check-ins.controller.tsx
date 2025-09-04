import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { dashboardKeys } from '@/features/dashboard/controllers/dashboard.controller';
import { clientsKeys } from '@/features/clients/controllers/clients.controller';
import { 
  CreateCheckInDto, 
  SearchCheckInsParams,
  CurrentlyInGymResponse,
  ClientCheckInHistory
} from '@gymspace/sdk';

const QUERY_KEYS = {
  checkIns: 'checkIns',
  currentlyInGym: 'currentlyInGym',
  clientHistory: 'clientHistory',
  stats: 'checkInStats',
} as const;

export const useCheckInsController = () => {
  const { sdk } = useGymSdk();
  const { gym } = useCurrentSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const gymId = gym?.id;

  // Create a new check-in
  const createCheckIn = useMutation({
    mutationFn: async (data: CreateCheckInDto) => {
      if (!gymId) throw new Error('No gym selected');
      return sdk.checkIns.createCheckIn(data);
    },
    onSuccess: (data) => {
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="solid">
            <ToastTitle>Check-in registered successfully</ToastTitle>
          </Toast>
        ),
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.checkIns] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.currentlyInGym] });
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.clientHistory, data.gymClientId] 
      });
      
      // Invalidate dashboard stats (check-in counts, recent activity)
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.recentActivity() });
      
      // Invalidate client stats to refresh the client's check-in data
      queryClient.invalidateQueries({ queryKey: clientsKeys.stats(data.gymClientId) });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to register check-in';
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>{message}</ToastDescription>
          </Toast>
        ),
      });
    },
  });

  // Get list of check-ins with filters
  const useCheckInsList = (params?: SearchCheckInsParams) => {
    return useQuery({
      queryKey: [QUERY_KEYS.checkIns, gymId, params],
      queryFn: async () => {
        if (!gymId) throw new Error('No gym selected');
        return sdk.checkIns.searchCheckIns(params);
      },
      enabled: !!gymId,
    });
  };

  // Get clients currently in the gym
  const useCurrentlyInGym = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.currentlyInGym, gymId],
      queryFn: async (): Promise<CurrentlyInGymResponse> => {
        if (!gymId) throw new Error('No gym selected');
        return sdk.checkIns.getCurrentlyInGym();
      },
      enabled: !!gymId,
      refetchInterval: 60000, // Refresh every minute
    });
  };

  // Get client check-in history
  const useClientCheckInHistory = (clientId: string, enabled = true) => {
    return useQuery({
      queryKey: [QUERY_KEYS.clientHistory, clientId],
      queryFn: async (): Promise<ClientCheckInHistory> => {
        if (!gymId) throw new Error('No gym selected');
        return sdk.checkIns.getClientCheckInHistory(clientId);
      },
      enabled: !!gymId && !!clientId && enabled,
    });
  };

  // Get check-in statistics
  const useCheckInStats = (period: 'day' | 'week' | 'month' = 'month') => {
    return useQuery({
      queryKey: [QUERY_KEYS.stats, gymId, period],
      queryFn: async () => {
        if (!gymId) throw new Error('No gym selected');
        return sdk.checkIns.getGymCheckInStats({ period });
      },
      enabled: !!gymId,
    });
  };

  // Delete a check-in (for corrections)
  const deleteCheckIn = useMutation({
    mutationFn: async (checkInId: string) => {
      if (!gymId) throw new Error('No gym selected');
      return sdk.checkIns.deleteCheckIn(checkInId);
    },
    onSuccess: () => {
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="solid">
            <ToastTitle>Check-in deleted successfully</ToastTitle>
          </Toast>
        ),
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.checkIns] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.currentlyInGym] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete check-in';
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>{message}</ToastDescription>
          </Toast>
        ),
      });
    },
  });

  return {
    // Mutations
    createCheckIn,
    deleteCheckIn,
    
    // Queries
    useCheckInsList,
    useCurrentlyInGym,
    useClientCheckInHistory,
    useCheckInStats,
    
    // Utils
    invalidateCheckIns: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.checkIns] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.currentlyInGym] });
    },
  };
};

// Hook for managing check-in form state
export const useCheckInForm = () => {
  const { createCheckIn } = useCheckInsController();
  
  const handleCheckIn = async (clientId: string, notes?: string) => {
    await createCheckIn.mutateAsync({
      gymClientId: clientId,
      notes,
    });
  };

  return {
    handleCheckIn,
    isLoading: createCheckIn.isPending,
    error: createCheckIn.error,
  };
};