'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { GymSpaceSdk } from '@gymspace/sdk';

interface GymSdkContextValue {
  sdk: InstanceType<typeof GymSpaceSdk>;
}

const GymSdkContext = createContext<GymSdkContextValue | undefined>(undefined);

interface GymSdkProviderProps {
  children: React.ReactNode;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  
  return context;
}