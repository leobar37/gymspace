import { Stack } from 'expo-router';
import React from 'react';

export default function InventoryLayout() {
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
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="products"
        options={{
          title: 'Productos',
          headerBackTitle: ' ',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="products/new"
        options={{
          title: 'Nuevo Producto',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="products/[id]"
        options={{
          title: 'Detalle de Producto',
        }}
      />
      <Stack.Screen
        name="new-sale"
        options={{
          title: 'Nueva Venta',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="sales-history"
        options={{
          title: 'Historial de Ventas',
        }}
      />
      <Stack.Screen
        name="sales/[id]"
        options={{
          title: 'Detalle de Venta',
        }}
      />
      <Stack.Screen
        name="low-stock"
        options={{
          title: 'Stock Bajo',
        }}
      />
      <Stack.Screen
        name="reports"
        options={{
          title: 'Reportes',
        }}
      />
    </Stack>
  );
}