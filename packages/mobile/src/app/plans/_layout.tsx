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
          headerLeft: () => <BackButton label="" />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalles del Plan',
          headerBackTitle: '',
          headerLeft: () => <BackButton label="" />,
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar Plan',
          headerLeft: () => <BackButton label="" />,
        }}
      />
    </Stack>
  );
}
