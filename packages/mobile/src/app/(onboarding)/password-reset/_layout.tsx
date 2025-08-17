import { Stack } from 'expo-router';

export default function PasswordResetLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="request" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="reset" />
    </Stack>
  );
}