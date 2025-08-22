import React from 'react';
import { Stack } from 'expo-router';

export default function SubscriptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: true,
        headerBackTitle: 'Volver',
        headerTitleAlign: 'center',
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Planes de Suscripción',
          headerLargeTitle: false,
          headerBackVisible: true,
          headerBackTitle: 'Volver',
        }}
      />
    </Stack>
  );
}