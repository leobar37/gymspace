import { Stack } from 'expo-router';

export default function GymIdLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Atrás',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Detalles del Gimnasio',
        }} 
      />
      <Stack.Screen 
        name="edit-basic" 
        options={{ 
          title: 'Editar Información Básica',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="edit-schedule" 
        options={{ 
          title: 'Editar Horario',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="edit-social" 
        options={{ 
          title: 'Editar Redes Sociales',
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}