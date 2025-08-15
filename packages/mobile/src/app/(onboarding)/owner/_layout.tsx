import { Stack } from 'expo-router';
import React from 'react';

export default function OwnerOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false, // Disable swipe back gesture
      }}
    >
      <Stack.Screen
        name="step-1-personal"
        options={{
          headerBackVisible: true,
          headerShown: false,
          headerBackButtonMenuEnabled: false,
        }}
      />
      <Stack.Screen
        name="step-2-contact"
        options={{
          gestureEnabled: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="step-3-security"
        options={{
          gestureEnabled: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="organization-setup"
        options={{
          gestureEnabled: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="email-verification"
        options={{
          gestureEnabled: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create-gym"
        options={{
          gestureEnabled: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="welcome"
        options={{
          gestureEnabled: false,
          headerShown: false,
        }}
      />
    </Stack>
  );
}
