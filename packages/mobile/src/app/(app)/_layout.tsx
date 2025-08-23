import { useCurrentSession } from '@/hooks/useCurrentSession';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

function AppLayout() {
  const { isAuthenticated } = useGymSdk();
  const {
    session,
    isLoading: isSessionLoading,
    isError,
  } = useCurrentSession({
    enabled: isAuthenticated,
  });

  // If user is not authenticated, redirect to onboarding
  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)" />;
  }

  // While loading session data, show a loading indicator
  if (isSessionLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }
  // If session fetch failed or user doesn't have a valid session, redirect to onboarding
  // This will trigger after max refresh attempts in useCurrentSession
  if (isError || !session || !session.isAuthenticated) {
    return <Redirect href="/(onboarding)" />;
  }

  // If user doesn't have a gym (incomplete onboarding), redirect to appropriate onboarding step
  if (!session.gym || !session.gym.id) {
    // Determine the correct onboarding step based on user type
    const userType = session.user?.userType;
    if (userType === 'owner') {
      return <Redirect href="/(onboarding)/owner/welcome" />;
    } else if (userType === 'collaborator') {
      // Collaborators should complete their onboarding flow
      return <Redirect href="/(onboarding)/collaborator" />;
    } else {
      // Fallback to main onboarding
      return <Redirect href="/(onboarding)" />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="subscription/index"
        options={{
          title: 'Planes de Suscripción',
          headerLargeTitle: false,
          headerBackVisible: true,
          headerBackTitle: 'Volver',
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="clients" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="contracts" />
      <Stack.Screen name="plans" />
      <Stack.Screen name="suppliers" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="gym" />
    </Stack>
  );
}

export default AppLayout;
