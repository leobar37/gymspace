import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { useSession } from '@/contexts/SessionContext';
import { router } from 'expo-router';

// Query keys factory pattern for better type safety and organization
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  gyms: () => [...authKeys.all, 'gyms'] as const,
  currentGym: (gymId: string) => [...authKeys.gyms(), gymId] as const,
};

export const useAuthController = () => {
  const { sdk, setCurrentGymId, isAuthenticated } = useGymSdk();
  const queryClient = useQueryClient();
  const { storeTokens, clearAuth } = useSession();

  // Use the new session hook for current user and gym data
  const {
    session,
    user,
    gym,
    organization,
    isLoading: isLoadingSession,
    isError: isSessionError,
    error: sessionError,
    refetchSession,
    clearSession,
  } = useCurrentSession({
    enabled: isAuthenticated,
  });

  // Login mutation with secure token storage
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await sdk.auth.login(credentials);
      return response;
    },
    onSuccess: async (response) => {
      // Store tokens securely
      await storeTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      });

      // Small delay to ensure tokens are set in provider
      setTimeout(async () => {
        // Refetch session to get current user data
        await refetchSession();
      }, 100);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  // Logout mutation with complete cleanup
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Clear all auth and session data
      await clearAuth();
    },
    onSuccess: () => {
      // Clear session cache
      clearSession();

      // Clear all other cached data
      queryClient.clear();
    },
  });

  return {
    // Session data from useCurrentSession
    session,
    user,
    gym,
    organization,

    // Authentication state
    isAuthenticated: !!session,
    isLoadingSession,
    isSessionError,
    sessionError,

    // Mutations
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,

    // Utility functions
    refetchSession,
    clearSessionCache,

    // Gym context management
    setCurrentGymId: async (gymId: string) => {
      await setCurrentGymId(gymId);
      await refetchSession(); // Refetch session with new gym context
    },
  };
};

// Hook to check authentication and redirect if needed
export const useRequireAuth = (redirectTo: string = '/auth/login') => {
  const { isAuthenticated, isLoadingSession } = useAuthController();

  useEffect(() => {
    // Don't redirect while loading session
    if (isLoadingSession) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoadingSession, redirectTo]);

  return { isAuthenticated, isLoadingSession };
};
