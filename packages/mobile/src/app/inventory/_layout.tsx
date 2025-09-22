import { BackButton } from '@/shared/components';
import { Stack, useRouter } from 'expo-router';
import React from 'react';

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
          headerShown: true,
          animation: 'simple_push',
          title: 'Productos',
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
        name="products/[id]"
        options={{
          title: '',
          animation: 'fade_from_bottom',
          headerLeft: () => <BackButton label="" />,
        }}
      />

      <Stack.Screen
        name="categories"
        options={{
          headerShown: true,
          title: 'Categorías',
          headerLeft: () => <BackButton label="" />,
        }}
      />
      <Stack.Screen
        name="categories/new"
        options={{
          title: 'Nueva Categoría',
          headerBackTitle: 'Volver',
          headerLeft: () => <BackButton label="" />,
        }}
      />
      <Stack.Screen
        name="categories/[id]/edit"
        options={{
          title: 'Editar Categoría',
          headerLeft: () => <BackButton label="" />,
        }}
      />
      <Stack.Screen
        name="sales/[id]"
        options={{
          title: 'Detalle de Venta',
          headerLeft: () => <BackButton label="" />,
        }}
      />

      <Stack.Screen
        name="products/new"
        options={{
          headerShown: true,
          title: 'Nuevo Producto',
          headerBackTitle: 'Volver',
          headerLeft: () => <BackButton label="" />,
        }}
      />
      <Stack.Screen
        name="services/new"
        options={{
          headerShown: true,
          title: 'Nuevo Servicio',
          headerBackTitle: 'Volver',
          headerLeft: () => <BackButton label="" />,
        }}
      />

      <Stack.Screen
        name="new-sale"
        options={{
          headerShown: false,
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
          headerLeft: () => <BackButton label="" />,
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
