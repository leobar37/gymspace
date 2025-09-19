import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import type { CurrentSessionResponse } from '@gymspace/sdk';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@gymspace/access_token',
  CURRENT_GYM_ID: '@gymspace/current_gym_id',
} as const;

// Storage management object
const storage = {
  async getTokens() {
    const [accessToken, gymId] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.CURRENT_GYM_ID),
    ]);
    return { accessToken, gymId };
  },

  async setToken(token: string) {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  async setGymId(gymId: string) {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_GYM_ID, gymId);
  },

  async removeGymId() {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_GYM_ID);
  },

  async clear() {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_GYM_ID),
    ]);
  },
};

// Query keys (removed token from key)
export const sessionKeys = {
  all: ['session'] as const,
  current: () => [...sessionKeys.all, 'current'] as const,
};

// Token data interface
interface TokenData {
  accessToken: string;
}

// Session context value
interface SessionContextValue {
  // Auth state
  accessToken: string | null;
  currentGymId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Session data
  session: CurrentSessionResponse | null;
  organization: CurrentSessionResponse['organization'] | null;
  gym: CurrentSessionResponse['gym'] | null;
  user: CurrentSessionResponse['user'] | null;
  subscription: CurrentSessionResponse['subscription'] | null;

  // Session query state
  isSessionLoading: boolean;
  isSessionError: boolean;
  sessionError: Error | null;

  // Actions
  storeTokens: (tokenData: TokenData) => Promise<boolean>;
  setCurrentGymId: (gymId: string | null) => Promise<void>;
  clearAuth: () => Promise<void>;
  refreshSession: () => Promise<any>;
  refetchSession: () => Promise<any>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { sdk } = useGymSdk();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentGymId, setCurrentGymIdState] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const queryClient = useQueryClient();

  // Store tokens - sets token in SDK and refetches session
  const storeTokens = useCallback(
    async (tokenData: TokenData): Promise<boolean> => {
      try {
        // Store in storage
        await storage.setToken(tokenData.accessToken);

        // Update SDK - SDK is the source of truth
        sdk.setAuthToken(tokenData.accessToken);

        // Refetch session after token is set - this will set accessToken if successful
        await queryClient.refetchQueries({ queryKey: sessionKeys.current() });

        return true;
      } catch (error) {
        console.error('Failed to store auth tokens:', error);
        return false;
      }
    },
    [sdk, queryClient],
  );

  // Set current gym ID - done directly in session response handling
  const setCurrentGymId = useCallback(
    async (gymId: string | null) => {
      try {
        if (gymId) {
          await storage.setGymId(gymId);
          sdk.setGymId(gymId);
        } else {
          await storage.removeGymId();
        }
        setCurrentGymIdState(gymId);
      } catch (error) {
        console.error('Failed to set current gym ID:', error);
      }
    },
    [sdk],
  );

  // Clear auth - cleans SDK, storage, queries and sets token to null
  const clearAuth = useCallback(async () => {
    try {
      // Clear storage and SDK
      await storage.clear();
      sdk.clearAuth();

      // Clear state
      setAccessToken(null);
      setCurrentGymIdState(null);

      // Remove all session queries
      queryClient.removeQueries({ queryKey: sessionKeys.all });
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }, [queryClient, sdk]);

  // Session query - source of truth for session data
  const sessionQuery = useQuery({
    queryKey: sessionKeys.current(),
    queryFn: async (): Promise<CurrentSessionResponse> => {
      // Initialize from storage only on first run
      if (!initializedRef.current) {
        initializedRef.current = true;

        try {
          const { accessToken: storedToken, gymId: storedGymId } = await storage.getTokens();

          if (storedToken) {
            // Set token in SDK - SDK is the source of truth
            sdk.setAuthToken(storedToken);
            if (storedGymId) {
              sdk.setGymId(storedGymId);
            }
          }
        } catch (error) {
          console.error('Failed to load stored auth:', error);
          // If loading fails, clear potentially corrupted storage
          await storage.clear();
        }
      }

      const response = await sdk.auth.getCurrentSession();

      // Always update storage with the latest token from response
      try {
        if (response.accessToken) {
          await storage.setToken(response.accessToken);
          // Update SDK token in case it's a refreshed token
          sdk.setAuthToken(response.accessToken);
        }

        if (response.gym?.id) {
          await storage.setGymId(response.gym.id);
          sdk.setGymId(response.gym.id);
        }
      } catch (error) {
        console.error('Failed to update storage after session fetch:', error);
      }

      return response;
    },
    enabled: true,
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Handle session data updates - this is where we update state from SDK response
  useEffect(() => {
    if (sessionQuery.data) {
      // Set accessToken from session response
      if (sessionQuery.data.accessToken) {
        setAccessToken(sessionQuery.data.accessToken);
      }

      // Update gym ID from session if it has changed
      if (sessionQuery.data.gym && sessionQuery.data.gym.id !== currentGymId) {
        setCurrentGymIdState(sessionQuery.data.gym.id);
        setCurrentGymId(sessionQuery.data.gym.id);
      }
    }
  }, [sessionQuery.data, currentGymId, setCurrentGymId]);

  // Handle auth errors from session query
  useEffect(() => {
    if (sessionQuery.error) {
      const error = sessionQuery.error as any;
      if (error.status === 401 || error.message?.includes('Unauthorized')) {
        clearAuth();
      }
    }
  }, [sessionQuery.error, clearAuth]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: sessionKeys.current(),
    });
    return sessionQuery.refetch();
  }, [queryClient, sessionQuery]);

  const refetchSession = useCallback(async () => {
    return sessionQuery.refetch();
  }, [sessionQuery]);

  const isAuthenticated = !!accessToken && !sessionQuery.isError;
  const currentSession = sessionQuery.data || null;

  const value: SessionContextValue = {
    // Auth state
    accessToken,
    currentGymId,
    isAuthenticated,
    isLoading: sessionQuery.isLoading,

    // Session data
    session: currentSession,
    organization: currentSession?.organization || null,
    gym: currentSession?.gym || null,
    user: currentSession?.user || null,
    subscription: currentSession?.subscription || null,

    // Session query state
    isSessionLoading: sessionQuery.isLoading,
    isSessionError: sessionQuery.isError,
    sessionError: sessionQuery.error || null,

    // Actions
    storeTokens,
    setCurrentGymId,
    clearAuth,
    refreshSession,
    refetchSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
