import React from 'react';
import { Redirect } from 'expo-router';
import { useGymSdk } from '@/providers/GymSdkProvider';
interface AuthRedirectProps {
  children: React.ReactNode;
}

export function AuthRedirect({ children }: AuthRedirectProps) {
  const { isAuthenticated } = useGymSdk();

  // If user is already authenticated, redirect to main app
  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return <>{children}</>;
}