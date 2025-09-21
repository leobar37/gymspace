import React from 'react';
import { Stack } from 'expo-router';
import { NewSaleProvider } from '@/features/sales/context/NewSaleProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BackButton } from '@/shared/components/BackButton';

export default function NewSaleLayout() {
  return (
    <NewSaleProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTintColor: '#1f2937',
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerShadowVisible: true,
            headerLeft: () => <BackButton />,
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'Nueva Venta',
              headerBackVisible: false,
              headerLeft: () => <BackButton />,
            }}
          />
          <Stack.Screen
            name="select-items"
            options={{
              title: 'Seleccionar Productos',
              headerBackVisible: false,
              presentation: 'modal',
              headerLeft: () => <BackButton />,
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </NewSaleProvider>
  );
}