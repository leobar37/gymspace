import { useCurrentSession } from '@/hooks/useCurrentSession';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { Redirect, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

function AppLayout() {
  const { isAuthenticated: isAuthFromProvider, isLoading: isProviderLoading } = useGymSdk();
  const {
    session,
    isLoading: isSessionLoading,
    isError,
    isAuthenticated,
  } = useCurrentSession({
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

  // If user is not authenticated, redirect to onboarding
  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)" />;
  }

  // If session fetch failed or user doesn't have a valid session, redirect to onboarding
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
      {/* <Stack.Screen
        name="subscription/index"
        options={{
          title: 'Planes de Suscripción',
          headerLargeTitle: false,
          headerBackVisible: true,
          headerBackTitle: 'Volver',
        }}
      /> */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default AppLayout;
