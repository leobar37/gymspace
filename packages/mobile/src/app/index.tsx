import { Redirect } from 'expo-router';
import React from 'react';
import { useSession } from '@/contexts/SessionContext';
import { ActivityIndicator, View } from 'react-native';

export default function HomeScreen() {
  const { isAuthenticated, isLoading } = useSession();
  
  // While checking authentication status, show loading spinner
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }
  
  // If user is authenticated, redirect directly to app
  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }
  
  // If not authenticated, redirect to onboarding
  return <Redirect href="/(onboarding)" />;
}