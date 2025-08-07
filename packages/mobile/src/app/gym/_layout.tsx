import { Stack } from 'expo-router';

export default function GymLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
      }}
    />
  );
}