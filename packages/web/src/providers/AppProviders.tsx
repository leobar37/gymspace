'use client';

import React from 'react';
import { QueryProvider } from './QueryProvider';
import { GymSdkProvider } from './GymSdkProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <GymSdkProvider>
        {children}
      </GymSdkProvider>
    </QueryProvider>
  );
}