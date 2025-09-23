import { Stack } from 'expo-router';
import { BackButton } from '@/shared/components/BackButton';

export default function SuppliersLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Proveedores',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Crear Proveedor',
          headerBackTitle: 'Atrás',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalles del Proveedor',
          headerBackTitle: 'Atrás',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar Proveedor',
          headerBackTitle: 'Atrás',
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}
