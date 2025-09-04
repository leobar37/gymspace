import { useCurrentSession } from '@/hooks/useCurrentSession';
import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

function AppLayout() {
  const {
    session,
    authToken,
    isLoading: isSessionLoading,
    isError,
    isAuthenticated,
  } = useCurrentSession();

  // If user is not authenticated, redirect to onboarding
  if (!isAuthenticated) {
    console.log(
      'DEBUG: Not authenticated 1',
      JSON.stringify({ isAuthenticated, session: !!session, authToken }, null, 2),
    );

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>
          DEBUG: Not authenticated - should redirect to 0 /(onboarding)
          {JSON.stringify({ isAuthenticated, session: !!session, authToken }, null, 3)}
        </Text>
      </View>
    );
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
    console.log(
      'DEBUG: Session error or invalid 2',
      JSON.stringify({ isError, session, isAuthenticated: session?.isAuthenticated }, null, 2),
    );
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>DEBUG: Session error or invalid - should redirect to 1 /(onboarding)</Text>
      </View>
    );
  }

  // If user doesn't have a gym (incomplete onboarding), redirect to appropriate onboarding step
  if (!session.gym || !session.gym.id) {
    // Determine the correct onboarding step based on user type
    const userType = session.user?.userType;
    console.log('DEBUG: No gym found 3', JSON.stringify({ gym: session.gym, userType }, null, 2));

    if (userType === 'owner') {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>DEBUG: Owner without gym - should redirect to 2 /(onboarding)/owner/welcome</Text>
        </View>
      );
    } else if (userType === 'collaborator') {
      // Collaborators should complete their onboarding flow
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>
            DEBUG: Collaborator without gym - should redirect to 3 /(onboarding)/collaborator
          </Text>
        </View>
      );
    } else {
      // Fallback to main onboarding
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>DEBUG: Unknown user type - should redirect to 4 /(onboarding)</Text>
        </View>
      );
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
