import { useAtom, useSetAtom } from 'jotai';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import type { CurrentSessionResponse } from '@gymspace/sdk';
import { 
  sessionAtom, 
  clearAuthAtom,
  setCurrentGymIdAtom 
} from '@/store/auth.atoms';

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
  const { sdk, authToken, currentGymId, isAuthenticated: isAuthFromProvider, isLoading: isProviderLoading } = useGymSdk();
  const [session, setSession] = useAtom(sessionAtom) as [any, any];
  const clearAuth = useSetAtom(clearAuthAtom);
  const setCurrentGymId = useSetAtom(setCurrentGymIdAtom);
  const queryClient = useQueryClient();

  const {
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 30 * 60 * 1000, // 30 minutes
  } = options;

  const sessionQuery = useQuery({
    queryKey: sessionKeys.current(),
    queryFn: async (): Promise<CurrentSessionResponse | null> => {
      // Don't even try if we don't have a token
      if (!authToken) {
        return null;
      }
      
      try {
        const response = await sdk.auth.getCurrentSession();
        console.log('Session fetched successfully:', response);
        
        // Store in Jotai atom
        setSession(response);
        
        // If we get a gym in the response but don't have a current gym ID stored,
        // store it automatically (this handles the onboarding case)
        if (response?.gym?.id && !currentGymId) {
          setCurrentGymId(response.gym.id);
        }

        return response;
      } catch (error: any) {
        console.error('Session fetch error:', error);
        // Handle 401 errors by clearing tokens but NOT redirecting here
        // Let the layout components handle navigation
        if (error.status === 401 || error.message?.includes('Unauthorized')) {
          console.log('Auth error, clearing tokens');
          clearAuth();
          return null;
        }
        throw error;
      }
    },
    enabled: enabled && isAuthFromProvider && Boolean(authToken) && !isProviderLoading,
    staleTime,
    gcTime,
    refetchOnMount,
    refetchOnWindowFocus,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
        return false;
      }
      // Don't retry if we don't have valid tokens
      if (!authToken) {
        return false;
      }
      // Retry network errors up to 1 time
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // No useEffect here - let the layout components handle navigation based on auth state

  // Utility functions
  const refetchSession = () => {
    return queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
  };

  const clearSessionCache = () => {
    queryClient.removeQueries({ queryKey: sessionKeys.all });
    setSession(null);
  };

  const updateSessionCache = (
    updater: (old: CurrentSessionResponse | null | undefined) => CurrentSessionResponse | null,
  ) => {
    queryClient.setQueryData(sessionKeys.current(), updater);
    const newData = queryClient.getQueryData(sessionKeys.current()) as CurrentSessionResponse | null;
    if (newData) {
      setSession(newData);
    }
  };

  // Use session from Jotai atom for immediate updates
  const currentSession = session || sessionQuery.data;

  // Determine loading state - we're loading if provider is loading OR session is loading when auth is true
  const isLoading = isProviderLoading || (isAuthFromProvider && sessionQuery.isLoading);
  
  // Determine authentication state more carefully
  // We're authenticated if:
  // 1. Provider says we have auth token AND
  // 2. Either we're still loading the session OR we have a successful session
  const isAuthenticated = isAuthFromProvider && (sessionQuery.isLoading || (sessionQuery.isSuccess && !!currentSession?.isAuthenticated));

  return {
    // Session data
    session: currentSession,
    user: currentSession?.user || null,
    gym: currentSession?.gym || null,
    organization: currentSession?.organization || null,
    subscription: currentSession?.subscription || null,
    permissions: currentSession?.permissions || [],
    authToken,

    // Query states
    isLoading,
    isFetching: sessionQuery.isFetching,
    isError: sessionQuery.isError,
    error: sessionQuery.error,
    isSuccess: sessionQuery.isSuccess,

    // Utility functions
    refetchSession,
    clearSessionCache,
    updateSessionCache,

    // Computed values
    isAuthenticated,
    hasPermission: (permission: string) => {
      return currentSession?.permissions?.includes(permission) || false;
    },
    isOwner: currentSession?.user?.userType === 'owner',
    isCollaborator: currentSession?.user?.userType === 'collaborator',
  };
}