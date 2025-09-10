import { Stack } from 'expo-router';
import React from 'react';
import { useRouter } from 'expo-router';
import { BackButton } from '@/shared/components';

export default function InventoryLayout() {
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
        name="products"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="new-sale"
        options={{
          title: "Nueva Venta",
          headerLeft: () => (
            <BackButton label="" onPress={() => router.push('/sales-history')} />
          ),
        }}
      />
      <Stack.Screen
        name="categories"
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="categories/new"
        options={{
          title: 'Nueva Categoría',
          headerBackTitle: 'Volver',
        }}
      />
      <Stack.Screen
        name="categories/[id]/edit"
        options={{
          title: 'Editar Categoría',
        }}
      />
      <Stack.Screen
        name="sales/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="products/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="products/new"
        options={{
          headerShown: true,
          title: 'Nuevo Producto',
          headerBackTitle: 'Volver',
        }}
      />
      <Stack.Screen
        name="services/new"
        options={{
          headerShown: true,
          title: 'Nuevo Servicio',
          headerBackTitle: 'Volver',
        }}
      />
      <Stack.Screen
        name="services/[id]"
        options={{
          headerShown: true,
          title: '',
          headerBackTitle: '',
          animation: 'fade_from_bottom',
          headerLeft: () => (
            <BackButton label="" onPress={() => router.push('/inventory/services')} />
          ),
        }}
      />
      <Stack.Screen
        name="services/[id]/edit"
        options={{
          headerShown: true,
          title: '',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="services"
        options={{
          headerShown: true,
          title: 'Servicios',
          headerBackTitle: '',
          headerLeft: () => <BackButton label="" onPress={() => router.back()} />,
        }}
      />
    </Stack>
  );
}
