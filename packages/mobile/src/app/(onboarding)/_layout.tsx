import { useGymSdk } from '@/providers/GymSdkProvider';
import { Redirect, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useCurrentSession } from '@/hooks/useCurrentSession';

export default function OnboardingLayout() {
  const { isAuthenticated: isAuthFromProvider, isLoading: isProviderLoading } = useGymSdk();
  const { session, isLoading: isSessionLoading, isAuthenticated } = useCurrentSession({
    // Only fetch session if we have auth from provider
    enabled: isAuthFromProvider,
  });
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Mark that we've checked auth after provider loads
  useEffect(() => {
    if (!isProviderLoading) {
      setHasCheckedAuth(true);
    }
  }, [isProviderLoading]);

  // While checking authentication status initially, show loading
  if (!hasCheckedAuth || (isAuthFromProvider && isSessionLoading)) {
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
      <Stack.Screen
        name="owner"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="collaborator" />
    </Stack>
  );
}
