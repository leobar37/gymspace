import { Redirect } from 'expo-router';
import React from 'react';
import { useSession } from '@/contexts/SessionContext';
import { ActivityIndicator, View } from 'react-native';

export default function HomeScreen() {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
        }}
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(onboarding)" />;
}
