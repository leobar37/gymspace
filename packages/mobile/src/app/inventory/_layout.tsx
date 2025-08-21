import { Stack } from 'expo-router';
import React from 'react';
import { useRouter } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';

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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="low-stock"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reports"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="sales-history"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="categories"
        options={{
          headerShown: false,
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
        name="services"
        options={{
          headerShown: true,
          title: 'Servicios',
          headerBackTitle: 'Volver',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/inventory')}
              style={{ marginLeft: 10 }}
            >
              <Text style={{ color: '#374151' }}>Volver</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
