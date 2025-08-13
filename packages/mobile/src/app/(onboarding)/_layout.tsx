import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useCurrentSession } from '@/hooks/useCurrentSession';

export default function OnboardingLayout() {
  const { isAuthenticated } = useGymSdk();
  const { session, isLoading } = useCurrentSession({
    enabled: isAuthenticated,
  });

  // While checking authentication status, show loading
  if (isAuthenticated && isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // If user is authenticated and has a valid session with a gym, redirect to dashboard
  if (isAuthenticated && session?.isAuthenticated && session?.gym?.id) {
    return <Redirect href="/(app)" />;
  }

  // If authenticated but no gym (incomplete onboarding), continue with onboarding
  // If not authenticated, show onboarding screens
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="owner" />
      <Stack.Screen name="collaborator" />
    </Stack>
  );
}