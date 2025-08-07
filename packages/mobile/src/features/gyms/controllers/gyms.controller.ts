import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { Gym, UpdateGymDto, GymStats } from '@gymspace/sdk';

const QUERY_KEYS = {
  currentGym: ['gym', 'current'],
  gymById: (id: string) => ['gym', id],
  gymStats: (id: string) => ['gym', id, 'stats'],
  organizationGyms: ['gyms', 'organization'],
};

export const useCurrentGym = () => {
  const { sdk, currentGymId } = useGymSdk();

  return useQuery({
    queryKey: QUERY_KEYS.gymById(currentGymId || ''),
    queryFn: async () => {
      if (!currentGymId) {
        throw new Error('No current gym selected');
      }
      return sdk.gyms.getGym(currentGymId);
    },
    enabled: !!currentGymId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useGym = (gymId: string) => {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: QUERY_KEYS.gymById(gymId),
    queryFn: () => sdk.gyms.getGym(gymId),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useGymStats = (gymId?: string) => {
  const { sdk, currentGymId } = useGymSdk();
  const targetGymId = gymId || currentGymId;

  return useQuery({
    queryKey: QUERY_KEYS.gymStats(targetGymId || ''),
    queryFn: async () => {
      if (!targetGymId) {
        return null;
      }
      return sdk.gyms.getGymStats(targetGymId);
    },
    enabled: !!targetGymId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOrganizationGyms = () => {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: QUERY_KEYS.organizationGyms,
    queryFn: () => sdk.gyms.getOrganizationGyms(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateGym = () => {
  const { sdk, currentGymId } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: UpdateGymDto }) => {
      const gymId = id || currentGymId;
      if (!gymId) {
        throw new Error('No gym ID provided');
      }
      return sdk.gyms.updateGym(gymId, data);
    },
    onSuccess: (updatedGym) => {
      // Invalidate and update cache
      queryClient.setQueryData(QUERY_KEYS.gymById(updatedGym.id), updatedGym);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizationGyms });
    },
    onError: (error: any) => {
      console.error('Error updating gym:', error);
    },
  });
};

export const useUpdateCurrentGym = () => {
  const { sdk, currentGymId } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<UpdateGymDto>) => {
      return sdk.gyms.updateCurrentGym(data);
    },
    onSuccess: (updatedGym) => {
      // Update cache for current gym
      if (currentGymId) {
        queryClient.setQueryData(QUERY_KEYS.gymById(currentGymId), updatedGym);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gymStats(currentGymId) });
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizationGyms });
      // Also refetch session to update gym data
      queryClient.invalidateQueries({ queryKey: ['session', 'current'] });
    },
    onError: (error: any) => {
      console.error('Error updating current gym:', error);
    },
  });
};

export const useToggleGymStatus = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gymId: string) => {
      return sdk.gyms.toggleGymStatus(gymId);
    },
    onSuccess: (updatedGym) => {
      // Update cache
      queryClient.setQueryData(QUERY_KEYS.gymById(updatedGym.id), updatedGym);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizationGyms });
    },
    onError: (error: any) => {
      console.error('Error toggling gym status:', error);
    },
  });
};