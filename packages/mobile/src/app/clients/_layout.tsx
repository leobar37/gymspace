import { Stack } from 'expo-router';
import React from 'react';
import { BackButton } from '@/shared/components/BackButton';

export default function ClientsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#374151',
        animation: 'slide_from_right',
        headerBackTitle: ' ',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          headerShown: true,
          title: 'Nuevo Cliente',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar Cliente',
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}
