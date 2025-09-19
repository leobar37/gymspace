import { Stack } from 'expo-router';
import React from 'react';
import { BackButton } from '@/shared/components/BackButton';

export default function ClientsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
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
