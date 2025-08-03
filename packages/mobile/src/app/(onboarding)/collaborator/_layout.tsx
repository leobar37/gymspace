import React from 'react';
import { Stack } from 'expo-router';

export default function CollaboratorOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="invitation" />
      <Stack.Screen name="complete-registration" />
    </Stack>
  );
}