import { useGymSdk } from '@/providers/GymSdkProvider';
import {
  clearAuthAtom,
  sessionAtom,
  setCurrentGymIdAtom,
  hasReachedMaxFailures,
  resetAuthFailureTracking,
  incrementAuthFailureCount,
} from '@/store/auth.atoms';
import type { CurrentSessionResponse } from '@gymspace/sdk';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { useSegments } from 'expo-router';

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
  const {
    sdk,
    authToken,
    currentGymId,
    isAuthenticated: isAuthFromProvider,
    isLoading: isProviderLoading,
  } = useGymSdk();
  const [session, setSession] = useAtom(sessionAtom) as [any, any];
  const clearAuth = useSetAtom(clearAuthAtom);
  const setCurrentGymId = useSetAtom(setCurrentGymIdAtom);
  const queryClient = useQueryClient();
  const segments = useSegments();

  const {
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000,
    gcTime = 30 * 60 * 1000,
  } = options;

  const isOnAuthRoute = segments[0] === '(onboarding)' || Array(segments).length === 0;

  const sessionQuery = useQuery<CurrentSessionResponse>({
    queryKey: sessionKeys.current(),
    queryFn: async () => {
      if (!authToken) {
        throw new Error('No auth token available');
      }

      if (hasReachedMaxFailures) {
        throw new Error('Max auth failures reached');
      }

      try {
        console.log(
          'Fetching current session with token:',
          authToken ? 'Token present' : 'No token',
        );
        const response = await sdk.auth.getCurrentSession();
        console.log('Session fetched successfully', response);

        resetAuthFailureTracking();
        setSession(response);

        if (response.gym) {
          if (!currentGymId || currentGymId !== response.gym.id) {
            setCurrentGymId(response.gym.id);
            sdk.setGymId(response.gym.id);
          }
        }

        return response;
      } catch (error: any) {
        console.error('Session fetch error:', error);

        if (error.status === 401 || error.message?.includes('Unauthorized')) {
          const newFailureCount = incrementAuthFailureCount();
          console.log(`Auth error (attempt ${newFailureCount}/4), clearing tokens`);

          if (newFailureCount >= 4) {
            console.log('Max auth failures reached, stopping further attempts');
          }

          await clearAuth();
          queryClient.removeQueries({ queryKey: sessionKeys.all });
        }

        throw error;
      }
    },
    enabled:
      enabled &&
      isAuthFromProvider &&
      Boolean(authToken) &&
      !isProviderLoading &&
      !isOnAuthRoute &&
      !hasReachedMaxFailures,
    staleTime,
    gcTime,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }

      if (isOnAuthRoute) {
        return false;
      }

      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount,
    refetchOnWindowFocus,
  });

  const isLoading = sessionQuery.isLoading || isProviderLoading;
  const isAuthenticated = isAuthFromProvider && !!session && !sessionQuery.isError;

  const clearSession = () => {
    setSession(null);
    queryClient.removeQueries({ queryKey: sessionKeys.all });
  };

  const refreshSession = async () => {
    await queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
    return sessionQuery.refetch();
  };

  const refetchSession = async () => {
    return sessionQuery.refetch();
  };

  const currentSession = session || sessionQuery.data;

  return {
    session: currentSession,
    organization: currentSession?.organization,
    gym: currentSession?.gym,
    user: currentSession?.user,
    isLoading,
    isError: sessionQuery.isError,
    error: sessionQuery.error,
    isAuthenticated,
    hasSession: !!currentSession,
    clearSession,
    refreshSession,
    refetchSession,
    refetch: sessionQuery.refetch,
  };
}
