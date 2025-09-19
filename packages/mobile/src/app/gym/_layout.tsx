import { BackButton } from '@/shared/components/BackButton';
import { Stack } from 'expo-router';

export default function GymLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="organization/edit"
        options={{
          title: 'Editar Nombre',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="organization"
        options={{
          title: 'Organización',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
          title: 'Detalles del Gimnasio',
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}
