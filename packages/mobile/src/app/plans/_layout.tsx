import { BackButton } from '@/shared/components';
import { router, Stack } from 'expo-router';

export default function PlansLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Planes',
          headerLeft: () => <BackButton label="" onPress={() => router.push('/more')} />,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Crear Plan',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalles del Plan',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar Plan',
          headerBackTitle: 'Atrás',
        }}
      />
    </Stack>
  );
}
