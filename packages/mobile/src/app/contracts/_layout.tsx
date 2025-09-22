import { BackButton } from '@/shared/components/BackButton';
import { Stack } from 'expo-router';
import React from 'react';

export default function ContractsLayout() {
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
        animation: 'simple_push',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Crear Contrato',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalle del Contrato',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar Contrato',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="[id]/renew"
        options={{
          title: 'Renovar Contrato',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="expiring"
        options={{
          title: 'Contratos por Vencer 2',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
