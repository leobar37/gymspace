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
        }}
      />
      <Stack.Screen
        name="products/new"
        options={{
          title: 'Nuevo Producto',
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
      <Stack.Screen
        name="categories"
        options={{
          title: 'Categorías',
        }}
      />
      <Stack.Screen
        name="categories/new"
        options={{
          title: 'Nueva Categoría',
        }}
      />
      <Stack.Screen
        name="categories/[id]/edit"
        options={{
          title: 'Editar Categoría',
        }}
      />
    </Stack>
  );
}