import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  // No authentication checks here to prevent redirect loops
  // The app layout handles authentication and redirects appropriately
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="owner" />
      <Stack.Screen name="collaborator" />
    </Stack>
  );
}