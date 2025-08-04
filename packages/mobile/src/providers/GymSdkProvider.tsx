import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { GymSpaceSdk } from '@gymspace/sdk';
import { useSecureStorage } from '@/hooks/useSecureStorage';
import Constants from 'expo-constants';

interface GymSdkContextValue {
  sdk: GymSpaceSdk;
  isAuthenticated: boolean;
  authToken: string | null;
  currentGymId: string | null;
  setAuthToken: (token: string | null) => Promise<void>;
  setCurrentGymId: (gymId: string | null) => Promise<void>;
  clearAuth: () => Promise<void>;
}

const GymSdkContext = createContext<GymSdkContextValue | undefined>(undefined);

interface GymSdkProviderProps {
  children: React.ReactNode;
}

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5200/api/v1';
console.log("api",API_BASE_URL);

export function GymSdkProvider({ children }: GymSdkProviderProps) {
  const { getItem, setItem, removeItem } = useSecureStorage();
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [currentGymId, setCurrentGymIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize SDK
  const sdk = useMemo(() => {
    return new GymSpaceSdk({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
  }, []);

  // Load stored auth data on mount
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const [storedToken, storedGymId] = await Promise.all([
          getItem('authToken'),
          getItem('currentGymId'),
        ]);

        if (storedToken) {
          setAuthTokenState(storedToken);
          sdk.setAuthToken(storedToken);
        }

        if (storedGymId) {
          setCurrentGymIdState(storedGymId);
          sdk.setGymId(storedGymId);
        }
      } catch (error) {
        console.error('Failed to load auth data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, [getItem, sdk]);

  // Update auth token
  const setAuthToken = async (token: string | null) => {
    if (token) {
      await setItem('authToken', token);
      sdk.setAuthToken(token);
    } else {
      await removeItem('authToken');
      sdk.clearAuth();
    }
    setAuthTokenState(token);
  };

  // Update current gym ID
  const setCurrentGymId = async (gymId: string | null) => {
    if (gymId) {
      await setItem('currentGymId', gymId);
      sdk.setGymId(gymId);
    } else {
      await removeItem('currentGymId');
    }
    setCurrentGymIdState(gymId);
  };

  // Clear all auth data
  const clearAuth = async () => {
    await Promise.all([
      removeItem('authToken'),
      removeItem('currentGymId'),
    ]);
    sdk.clearAuth();
    setAuthTokenState(null);
    setCurrentGymIdState(null);
  };

  const value = useMemo(
    () => ({
      sdk,
      isAuthenticated: !!authToken,
      authToken,
      currentGymId,
      setAuthToken,
      setCurrentGymId,
      clearAuth,
    }),
    [sdk, authToken, currentGymId]
  );

  // Don't render children until auth data is loaded
  if (isLoading) {
    return null;
  }

  return <GymSdkContext.Provider value={value}>{children}</GymSdkContext.Provider>;
}

export function useGymSdk() {
  const context = useContext(GymSdkContext);
  if (!context) {
    throw new Error('useGymSdk must be used within a GymSdkProvider');
  }
  return context;
}