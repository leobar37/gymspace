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
            headerShadowVisible: false,
            headerLeft: () => <BackButton />,
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'Nueva Venta',
              headerLeft: () => <BackButton />,
            }}
          />
          <Stack.Screen
            name="select-items"
            options={{
              title: 'Seleccionar Productos',
              headerBackVisible: false,
              animation: 'simple_push',
              headerLeft: () => <BackButton />,
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </NewSaleProvider>
  );
}
