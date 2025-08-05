import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useAuthToken } from '@/hooks/useAuthToken';
import type { CurrentSessionResponse } from '@gymspace/sdk';

// Query key factory
export const sessionKeys = {
  all: ['session'] as const,
  current: () => [...sessionKeys.all, 'current'] as const,
};

export interface UseCurrentSessionOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useCurrentSession(options: UseCurrentSessionOptions = {}) {
  const { sdk, isAuthenticated, authToken, currentGymId, setCurrentGymId } = useGymSdk();
  const { hasValidToken, refreshToken } = useAuthToken();
  const queryClient = useQueryClient();

  const {
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes - session data doesn't change frequently
    gcTime = 30 * 60 * 1000, // 30 minutes - keep in cache longer
  } = options;

  const sessionQuery = useQuery({
    queryKey: sessionKeys.current(),
    queryFn: async (): Promise<CurrentSessionResponse | null> => {
      // Double-check token validity before making the request
      const tokenValid = await hasValidToken();

      if (!tokenValid) {
        // Try to refresh token first
        const refreshedToken = await refreshToken();
        if (!refreshedToken) {
          return null;
        }
      }
      try {
        const response = await sdk.auth.getCurrentSession();

        console.log('response', response);

        return response;
      } catch (error: any) {
        // Handle 401 errors by attempting token refresh
        if (error.status === 401) {
          const refreshedToken = await refreshToken();
          if (refreshedToken) {
            r;
            // Retry the request with new token
            const response = await sdk.auth.getCurrentSession();

            // If we get a gym in the response but don't have a current gym ID stored,
            // store it automatically (this handles the onboarding case)
            if (response?.gym?.id && !currentGymId) {
              await setCurrentGymId(response.gym.id);
            }

            return response;
          }
        }
        throw error;
      }
    },
    enabled: enabled && isAuthenticated && !!authToken,
    staleTime,
    gcTime,
    refetchOnMount,
    refetchOnWindowFocus,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors after token refresh attempt
      if (error?.status === 401) {
        return false;
      }
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Utility functions
  const refetchSession = () => {
    return queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
  };

  const clearSessionCache = () => {
    queryClient.removeQueries({ queryKey: sessionKeys.all });
  };

  const updateSessionCache = (
    updater: (old: CurrentSessionResponse | null | undefined) => CurrentSessionResponse | null,
  ) => {
    queryClient.setQueryData(sessionKeys.current(), updater);
  };

  return {
    // Session data
    session: sessionQuery.data,
    user: sessionQuery.data?.user || null,
    gym: sessionQuery.data?.gym || null,
    organization: sessionQuery.data?.organization || null,
    permissions: sessionQuery.data?.permissions || [],

    // Query states
    isLoading: sessionQuery.isLoading,
    isFetching: sessionQuery.isFetching,
    isError: sessionQuery.isError,
    error: sessionQuery.error,
    isSuccess: sessionQuery.isSuccess,

    // Utility functions
    refetchSession,
    clearSessionCache,
    updateSessionCache,

    // Computed values
    isAuthenticated: sessionQuery.isSuccess && !!sessionQuery.data?.isAuthenticated,
    hasPermission: (permission: string) => {
      return sessionQuery.data?.permissions?.includes(permission) || false;
    },
    isOwner: sessionQuery.data?.user?.userType === 'owner',
    isCollaborator: sessionQuery.data?.user?.userType === 'collaborator',
  };
}
