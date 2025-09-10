import React, { createContext, useContext, useMemo } from 'react';
import { GymSpaceSdk } from '@gymspace/sdk';

// Keep only SDK in the base context
interface GymSdkBaseContextValue {
  sdk: GymSpaceSdk;
}

// Extended context that includes auth (for backward compatibility)
interface GymSdkContextValue extends GymSdkBaseContextValue {
  isAuthenticated: boolean;
  authToken: string | null;
  currentGymId: string | null;
  setAuthToken: (token: string | null) => Promise<void>;
  setCurrentGymId: (gymId: string | null) => Promise<void>;
  clearAuth: () => Promise<void>;
  isLoading: boolean;
}

const GymSdkContext = createContext<GymSdkBaseContextValue | undefined>(undefined);

interface GymSdkProviderProps {
  children: React.ReactNode;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export function GymSdkProvider({ children }: GymSdkProviderProps) {
  const sdk = useMemo(() => {
    const sdkInstance = new GymSpaceSdk({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
    return sdkInstance;
  }, []);

  const value = useMemo(
    () => ({
      sdk,
    }),
    [sdk],
  );

  return <GymSdkContext.Provider value={value}>{children}</GymSdkContext.Provider>;
}

export function useGymSdk(): GymSdkContextValue {
  const context = useContext(GymSdkContext);
  if (!context) {
    throw new Error('useGymSdk must be used within a GymSdkProvider');
  }
  
  // Try to get session context if available (for backward compatibility)
  let sessionContext: any = null;
  try {
    // Import inline to avoid circular dependency
    const { useSession } = require('@/contexts/SessionContext');
    sessionContext = useSession();
  } catch {
    // SessionContext not available yet (we're probably in SessionProvider itself)
  }
  
  if (sessionContext) {
    // Return extended context with auth info
    const setAuthToken = async (token: string | null) => {
      if (token) {
        await sessionContext.storeTokens({ accessToken: token });
      } else {
        await sessionContext.clearAuth();
      }
    };
    
    return {
      sdk: context.sdk,
      isAuthenticated: sessionContext.isAuthenticated,
      authToken: sessionContext.accessToken,
      currentGymId: sessionContext.currentGymId,
      setAuthToken,
      setCurrentGymId: sessionContext.setCurrentGymId,
      clearAuth: sessionContext.clearAuth,
      isLoading: sessionContext.isLoading,
    };
  }
  
  // Return minimal context (when called from SessionProvider)
  return {
    sdk: context.sdk,
    isAuthenticated: false,
    authToken: null,
    currentGymId: null,
    setAuthToken: async () => {},
    setCurrentGymId: async () => {},
    clearAuth: async () => {},
    isLoading: false,
  };
}
