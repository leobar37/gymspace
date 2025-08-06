import { Stack } from 'expo-router';

export default function ContractsLayout() {
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
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Contratos',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Nuevo Contrato',
          headerBackTitle: 'Cancelar',
          presentation: 'modal',
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