import React from 'react';
import { Stack } from 'expo-router';

export default function OwnerOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="step-1-personal" />
      <Stack.Screen name="step-2-contact" />
      <Stack.Screen name="step-3-security" />
      <Stack.Screen name="organization-setup" />
      <Stack.Screen name="email-verification" />
      <Stack.Screen name="create-gym" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}