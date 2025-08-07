import { Stack } from 'expo-router';
import React from 'react';

export default function InventoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: '#374151',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="products"
        options={{
          title: 'Productos',
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
        name="sale-detail"
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
      <Stack.Screen
        name="product-detail"
        options={{
          title: 'Detalle de Producto',
        }}
      />
      <Stack.Screen
        name="product-form"
        options={{
          title: 'Gestionar Producto',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}