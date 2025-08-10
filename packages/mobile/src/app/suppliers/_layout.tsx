import { Stack } from 'expo-router';

export default function SuppliersLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Crear Proveedor',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalles del Proveedor',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar Proveedor',
          headerBackTitle: 'Atrás',
        }}
      />
    </Stack>
  );
}