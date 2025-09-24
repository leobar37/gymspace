import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { UpdateProfileDto, UserProfileDto } from '@gymspace/sdk';
import { sessionKeys } from '@/contexts/SessionContext';

// Query keys factory pattern for better type safety and organization
export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
};

export const useProfileController = () => {
  const { sdk, isAuthenticated } = useGymSdk();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch current user profile
  const profileQuery = useQuery({
    queryKey: profileKeys.current(),
    queryFn: async () => {
      return await sdk.users.getProfile();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
  });

  // Update profile mutation with optimistic update
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileDto) => {
      return await sdk.users.updateProfile(data);
    },
    onMutate: async (newProfileData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.current() });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<UserProfileDto>(profileKeys.current());

      // Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData<UserProfileDto>(profileKeys.current(), {
          ...previousProfile,
          ...newProfileData,
        });
      }

      // Return a context object with the snapshotted value
      return { previousProfile };
    },
    onError: (error: any, newProfileData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.current(), context.previousProfile);
      }
      
      const message = error?.response?.data?.message || 'No se pudo actualizar tu perfil. Por favor intenta de nuevo.';
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>Error al actualizar</ToastTitle>
            <ToastDescription>{message}</ToastDescription>
          </Toast>
        ),
      });
    },
    onSuccess: (data) => {
      // Update the query data with the server response
      queryClient.setQueryData(profileKeys.current(), data);
      
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="solid">
            <ToastTitle>Perfil actualizado</ToastTitle>
            <ToastDescription>Tu información ha sido actualizada exitosamente.</ToastDescription>
          </Toast>
        ),
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
      // Also invalidate session to get updated user info
      queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
    },
  });

  // Refetch profile data
  const refetchProfile = async () => {
    await profileQuery.refetch();
  };

  // Clear profile cache
  const clearProfileCache = () => {
    queryClient.removeQueries({ queryKey: profileKeys.all });
  };

  return {
    // Profile data
    profile: profileQuery.data,
    isLoadingProfile: profileQuery.isLoading,
    isProfileError: profileQuery.isError,
    profileError: profileQuery.error,
    
    // Update mutation
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,
    isUpdateSuccess: updateProfileMutation.isSuccess,
    
    // Actions
    refetchProfile,
    clearProfileCache,
  };
};