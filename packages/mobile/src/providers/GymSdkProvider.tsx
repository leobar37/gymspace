import React, { createContext, useContext, useMemo, useEffect, useRef } from 'react';
import { GymSpaceSdk } from '@gymspace/sdk';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { loadable } from 'jotai/utils';
import { useRouter, useSegments } from 'expo-router';
import { 
  authAtom, 
  setAuthTokensAtom, 
  clearAuthAtom, 
  isAuthenticatedAtom,
  accessTokenAtom,
  currentGymIdAtom,
  setCurrentGymIdAtom,
  authLoadingAtom
} from '@/store/auth.atoms';

interface GymSdkContextValue {
  sdk: GymSpaceSdk;
  isAuthenticated: boolean;
  authToken: string | null;
  currentGymId: string | null;
  setAuthToken: (token: string | null) => void;
  setCurrentGymId: (gymId: string | null) => void;
  clearAuth: () => void;
  isLoading: boolean;
}

const GymSdkContext = createContext<GymSdkContextValue | undefined>(undefined);

interface GymSdkProviderProps {
  children: React.ReactNode;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Create loadable atoms for async values
const loadableAuthAtom = loadable(authAtom);
const loadableIsAuthenticatedAtom = loadable(isAuthenticatedAtom);
const loadableAccessTokenAtom = loadable(accessTokenAtom);
const loadableCurrentGymIdAtom = loadable(currentGymIdAtom);

export function GymSdkProvider({ children }: GymSdkProviderProps) {
  const authStateLoadable = useAtomValue(loadableAuthAtom);
  const setTokens = useSetAtom(setAuthTokensAtom);
  const clearAuthState = useSetAtom(clearAuthAtom);
  const setGymId = useSetAtom(setCurrentGymIdAtom);
  const [isLoading, setIsLoading] = useAtom(authLoadingAtom);
  const isAuthenticatedLoadable = useAtomValue(loadableIsAuthenticatedAtom);
  const authTokenLoadable = useAtomValue(loadableAccessTokenAtom);
  const currentGymIdLoadable = useAtomValue(loadableCurrentGymIdAtom);
  const router = useRouter();
  const segments = useSegments();
  const hasHandledAuthError = useRef(false);
  
  // Extract values from loadables with defaults
  const isAuthenticated = isAuthenticatedLoadable.state === 'hasData' ? isAuthenticatedLoadable.data : false;
  const authToken = authTokenLoadable.state === 'hasData' ? authTokenLoadable.data : null;
  const currentGymId = currentGymIdLoadable.state === 'hasData' ? currentGymIdLoadable.data : null;

  // Initialize SDK
  const sdk = useMemo(() => {
    const sdkInstance = new GymSpaceSdk({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
    return sdkInstance;
  }, []);

  // Sync SDK with auth state
  useEffect(() => {
    // Only sync when data is loaded
    if (authStateLoadable.state === 'hasData') {
      const data = authStateLoadable.data;
      if (data.accessToken) {
        if (data.refreshToken) {
          sdk.setTokens(data.accessToken, data.refreshToken);
        } else {
          sdk.setAuthToken(data.accessToken);
        }
      } else {
        sdk.clearAuth();
      }
      if (data.currentGymId) {
        sdk.setGymId(data.currentGymId);
      }
      // Mark as loaded after initial sync
      setIsLoading(false);
    } else if (authStateLoadable.state === 'loading') {
      setIsLoading(true);
    }
  }, [authStateLoadable, sdk, setIsLoading]);
  
  // Monitor auth state and handle errors
  useEffect(() => {
    // Check if we lost authentication
    if (!isLoading && !isAuthenticated && authStateLoadable.state === 'hasData') {
      // Check if we're not already on onboarding pages
      const isOnOnboarding = segments[0] === '(onboarding)' || segments.length === 0;
      
      // Only redirect if we're not on onboarding and haven't handled this error
      if (!isOnOnboarding && !hasHandledAuthError.current) {
        console.log('Auth lost, redirecting to onboarding');
        hasHandledAuthError.current = true;
        router.replace('/(onboarding)');
      }
    } else if (isAuthenticated) {
      // Reset the flag when auth is restored
      hasHandledAuthError.current = false;
    }
  }, [isAuthenticated, isLoading, authStateLoadable.state, segments, router]);

  // Update auth token
  const setAuthToken = (token: string | null) => {
    if (token) {
      setTokens({ accessToken: token });
    } else {
      clearAuthState();
    }
  };

  // Update current gym ID
  const setCurrentGymId = (gymId: string | null) => {
    setGymId(gymId);
  };

  // Clear auth for external use (includes SDK clearing)
  const clearAuth = () => {
    clearAuthState();
    sdk.clearAuth();
  };

  const value = useMemo(
    () => ({
      sdk,
      isAuthenticated,
      authToken,
      currentGymId,
      setAuthToken,
      setCurrentGymId,
      clearAuth,
      isLoading,
    }),
    [sdk, isAuthenticated, authToken, currentGymId, isLoading],
  );

  // Always provide the context, even while loading
  return <GymSdkContext.Provider value={value}>{children}</GymSdkContext.Provider>;
}

export function useGymSdk() {
  const context = useContext(GymSdkContext);
  if (!context) {
    throw new Error('useGymSdk must be used within a GymSdkProvider');
  }
  return context;
}
