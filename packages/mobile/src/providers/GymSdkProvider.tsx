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
  authLoadingAtom,
  sdkClearCallbackAtom,
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

const loadableAuthAtom = loadable(authAtom);
const loadableIsAuthenticatedAtom = loadable(isAuthenticatedAtom);
const loadableAccessTokenAtom = loadable(accessTokenAtom);
const loadableCurrentGymIdAtom = loadable(currentGymIdAtom);

export function GymSdkProvider({ children }: GymSdkProviderProps) {
  const authStateLoadable = useAtomValue(loadableAuthAtom);
  const setTokens = useSetAtom(setAuthTokensAtom);
  const clearAuthState = useSetAtom(clearAuthAtom);
  const setGymId = useSetAtom(setCurrentGymIdAtom);
  const setSdkClearCallback = useSetAtom(sdkClearCallbackAtom as any);
  const [isLoading, setIsLoading] = useAtom(authLoadingAtom);
  const isAuthenticatedLoadable = useAtomValue(loadableIsAuthenticatedAtom);
  const authTokenLoadable = useAtomValue(loadableAccessTokenAtom);
  const currentGymIdLoadable = useAtomValue(loadableCurrentGymIdAtom);
  const router = useRouter();
  const segments = useSegments();
  const hasHandledAuthError = useRef(false);

  const isAuthenticated =
    isAuthenticatedLoadable.state === 'hasData' ? isAuthenticatedLoadable.data : false;
  const authToken = authTokenLoadable.state === 'hasData' ? authTokenLoadable.data : null;
  const currentGymId = currentGymIdLoadable.state === 'hasData' ? currentGymIdLoadable.data : null;

  const sdk = useMemo(() => {
    const sdkInstance = new GymSpaceSdk({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
    return sdkInstance;
  }, []);

  useEffect(() => {
    setSdkClearCallback(() => sdk.clearAuth.bind(sdk));
  }, [sdk, setSdkClearCallback]);

  useEffect(() => {
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

      setIsLoading(false);
    } else if (authStateLoadable.state === 'loading') {
      setIsLoading(true);
    }
  }, [authStateLoadable, sdk, setIsLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && authStateLoadable.state === 'hasData') {
      const isOnOnboarding = segments[0] === '(onboarding)' || Array(segments).length === 0;

      if (!isOnOnboarding && !hasHandledAuthError.current) {
        console.log('Auth lost, redirecting to onboarding');
        hasHandledAuthError.current = true;
        router.replace('/(onboarding)');
      }
    } else if (isAuthenticated) {
      hasHandledAuthError.current = false;
    }
  }, [isAuthenticated, isLoading, authStateLoadable.state, segments, router]);

  const setAuthToken = async (token: string | null) => {
    if (token) {
      await setTokens({ accessToken: token });
    } else {
      await clearAuthState();
    }
  };

  const setCurrentGymId = (gymId: string | null) => {
    setGymId(gymId);
  };

  const clearAuth = async () => {
    await clearAuthState();
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

  return <GymSdkContext.Provider value={value}>{children}</GymSdkContext.Provider>;
}

export function useGymSdk() {
  const context = useContext(GymSdkContext);
  if (!context) {
    throw new Error('useGymSdk must be used within a GymSdkProvider');
  }
  return context;
}
