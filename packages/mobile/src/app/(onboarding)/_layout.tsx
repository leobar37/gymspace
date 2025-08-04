import React from 'react';
import { Stack } from 'expo-router';
import { AuthRedirect } from '@/components/AuthRedirect';

export default function OnboardingLayout() {
  return (
    <AuthRedirect>
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
    </AuthRedirect>
  );
}