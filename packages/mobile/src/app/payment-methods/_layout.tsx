import { BackButton } from '@/shared/components';
import { Stack, useRouter } from 'expo-router';
import React from 'react';

export default function PaymentMethodsLayout() {
  const router = useRouter();
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
          title: 'Métodos de Pago',
          headerShown: true,
          animation: 'ios_from_right',
          headerLeft: () => (
            <BackButton
              label=""
              onPress={() => {
                router.push('/more');
              }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Nuevo método de pago',
          headerShown: true,
          animation: 'ios_from_right',
          headerLeft: () => (
            <BackButton
              label=""
              onPress={() => {
                router.back();
              }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          title: 'Detalle del método',
          headerShown: true,
          animation: 'ios_from_right',
          headerLeft: () => (
            <BackButton
              label=""
              onPress={() => {
                router.back();
              }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar método de pago',
          animation: 'none',
          headerLeft: () => (
            <BackButton
              label=""
              onPress={() => {
                router.back();
              }}
            />
          ),
        }}
      />
    </Stack>
  );
}
