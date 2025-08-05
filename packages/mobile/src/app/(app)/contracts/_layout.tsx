import { Stack } from 'expo-router';

export default function ContractsLayout() {
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
          title: 'Crear Contrato',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalles del Contrato',
          headerBackTitle: 'Atrás',
        }}
      />
    </Stack>
  );
}