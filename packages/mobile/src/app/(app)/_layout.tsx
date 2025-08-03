import React from 'react';
import { Stack } from 'expo-router';
import { useGymSdk } from '../../providers/GymSdkProvider';
import { Redirect } from 'expo-router';

export default function AppLayout() {
  const { isAuthenticated } = useGymSdk();

  // If user is not authenticated, redirect to onboarding
  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Dashboard',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}