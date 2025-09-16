import { Stack } from 'expo-router';
import { BackButton } from '@/shared/components/BackButton';

export default function GymIdLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Atrás',
        headerLeft: () => <BackButton />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Detalles del Gimnasio',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="edit-basic"
        options={{
          title: 'Editar Información Básica',
          presentation: 'modal',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="edit-schedule"
        options={{
          title: 'Editar Horario',
          presentation: 'modal',
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="edit-social"
        options={{
          title: 'Editar Redes Sociales',
          presentation: 'modal',
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}