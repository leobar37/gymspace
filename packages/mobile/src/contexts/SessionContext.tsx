import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSegments } from 'expo-router';
import { useGymSdk } from '@/providers/GymSdkProvider';
import type { CurrentSessionResponse } from '@gymspace/sdk';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@gymspace/access_token',
  REFRESH_TOKEN: '@gymspace/refresh_token',
  EXPIRES_AT: '@gymspace/expires_at',
  CURRENT_GYM_ID: '@gymspace/current_gym_id',
} as const;

// Query keys
export const sessionKeys = {
  all: ['session'] as const,
  current: () => [...sessionKeys.all, 'current'] as const,
};

// Token data interface
interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

// Session context value
interface SessionContextValue {
  // Auth state
  accessToken: string | null;
  refreshToken: string | null;
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
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [currentGymId, setCurrentGymIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<CurrentSessionResponse | null>(null);
  
  const queryClient = useQueryClient();
  const router = useRouter();
  const segments = useSegments();
  const hasHandledAuthError = useRef(false);
  
  const isOnAuthRoute = segments[0] === '(onboarding)' || !segments[0];
  
  // Load stored auth data on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const [storedToken, storedRefresh, storedExpiry, storedGymId] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.EXPIRES_AT),
          AsyncStorage.getItem(STORAGE_KEYS.CURRENT_GYM_ID),
        ]);
        
        // Check if token is expired
        if (storedExpiry && Date.now() > parseInt(storedExpiry, 10)) {
          // Token expired, clear everything
          await clearAuth();
        } else if (storedToken) {
          setAccessToken(storedToken);
          setRefreshToken(storedRefresh);
          setCurrentGymIdState(storedGymId);
          
          // Sync with SDK
          if (storedRefresh) {
            sdk.setTokens(storedToken, storedRefresh);
          } else {
            sdk.setAuthToken(storedToken);
          }
          if (storedGymId) {
            sdk.setGymId(storedGymId);
          }
        }
      } catch (error) {
        console.error('Failed to load stored auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStoredAuth();
  }, []);
  
  // Store tokens
  const storeTokens = useCallback(async (tokenData: TokenData): Promise<boolean> => {
    try {
      const promises: Promise<void>[] = [
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken),
      ];
      
      if (tokenData.refreshToken) {
        promises.push(AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken));
      }
      
      if (tokenData.expiresAt) {
        promises.push(AsyncStorage.setItem(STORAGE_KEYS.EXPIRES_AT, tokenData.expiresAt.toString()));
      }
      
      await Promise.all(promises);
      
      // Update state
      setAccessToken(tokenData.accessToken);
      setRefreshToken(tokenData.refreshToken || null);
      
      // Update SDK
      if (tokenData.refreshToken) {
        sdk.setTokens(tokenData.accessToken, tokenData.refreshToken);
      } else {
        sdk.setAuthToken(tokenData.accessToken);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to store auth tokens:', error);
      return false;
    }
  }, [sdk]);
  
  // Set current gym ID
  const setCurrentGymId = useCallback(async (gymId: string | null) => {
    try {
      if (gymId) {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_GYM_ID, gymId);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_GYM_ID);
      }
      
      setCurrentGymIdState(gymId);
      
      // Update SDK
      if (gymId) {
        sdk.setGymId(gymId);
      }
    } catch (error) {
      console.error('Failed to set current gym ID:', error);
    }
  }, [sdk]);
  
  // Clear auth
  const clearAuth = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.EXPIRES_AT),
        AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_GYM_ID),
      ]);
      
      setAccessToken(null);
      setRefreshToken(null);
      setCurrentGymIdState(null);
      setSession(null);
      
      // Clear SDK auth
      sdk.clearAuth();
      
      // Clear session queries
      queryClient.removeQueries({ queryKey: sessionKeys.all });
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }, [queryClient, sdk]);
  
  // Sync SDK auth state whenever tokens change
  useEffect(() => {
    if (accessToken) {
      if (refreshToken) {
        sdk.setTokens(accessToken, refreshToken);
      } else {
        sdk.setAuthToken(accessToken);
      }
    } else {
      sdk.clearAuth();
    }
    
    if (currentGymId) {
      sdk.setGymId(currentGymId);
    }
  }, [sdk, accessToken, refreshToken, currentGymId]);
  
  // Session query
  const sessionQuery = useQuery<CurrentSessionResponse>({
    queryKey: sessionKeys.current(),
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('No auth token available');
      }
      
      try {
        console.log('Fetching current session with token:', accessToken ? 'Token present' : 'No token');
        const response = await sdk.auth.getCurrentSession();
        console.log('Session fetched successfully', response);
        
        setSession(response);
        
        // Update gym ID if changed
        if (response.gym && response.gym.id !== currentGymId) {
          await setCurrentGymId(response.gym.id);
        }
        
        return response;
      } catch (error: any) {
        console.error('Session fetch error:', error);
        
        if (error.status === 401 || error.message?.includes('Unauthorized')) {
          console.log('Auth error, clearing tokens');
          await clearAuth();
        }
        
        throw error;
      }
    },
    enabled: !!accessToken && !isLoading && !isOnAuthRoute,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
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
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
  
  // Handle auth state changes
  useEffect(() => {
    if (!isLoading && !accessToken && !isOnAuthRoute && !hasHandledAuthError.current) {
      console.log('Auth lost, redirecting to onboarding');
      hasHandledAuthError.current = true;
      router.replace('/(onboarding)');
    } else if (accessToken) {
      hasHandledAuthError.current = false;
    }
  }, [accessToken, isLoading, isOnAuthRoute, router]);
  
  // Refresh session
  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
    return sessionQuery.refetch();
  }, [queryClient, sessionQuery]);
  
  const refetchSession = useCallback(async () => {
    return sessionQuery.refetch();
  }, [sessionQuery]);
  
  const isAuthenticated = !!accessToken && !sessionQuery.isError;
  const currentSession = session || sessionQuery.data || null;
  
  const value: SessionContextValue = {
    // Auth state
    accessToken,
    refreshToken,
    currentGymId,
    isAuthenticated,
    isLoading,
    
    // Session data
    session: currentSession,
    organization: currentSession?.organization || null,
    gym: currentSession?.gym || null,
    user: currentSession?.user || null,
    subscription: currentSession?.subscription || null,
    
    // Session query state
    isSessionLoading: sessionQuery.isLoading,
    isSessionError: sessionQuery.isError,
    sessionError: sessionQuery.error,
    
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