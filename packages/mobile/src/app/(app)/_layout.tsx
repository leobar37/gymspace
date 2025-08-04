import { Icon } from '@/components/ui/icon';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { Redirect, Tabs } from 'expo-router';
import {
  FileTextIcon,
  HomeIcon,
  MenuIcon,
  UsersIcon,
} from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';

export default function AppLayout() {
  const { isAuthenticated } = useGymSdk();
  const { session, isLoading: isSessionLoading, isError } = useCurrentSession();
  // If user is not authenticated, redirect to onboarding
  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)" />;
  }

  // While loading session data, don't render anything
  if (isSessionLoading) {
    return null;
  }

  // If session fetch failed or user doesn't have a valid session, redirect to onboarding
  if (isError || !session || !session.isAuthenticated) {
    return <Redirect href="/(onboarding)" />;
  }

  // If user doesn't have a gym (incomplete onboarding), redirect to welcome screen
  // This handles cases where tokens exist but onboarding isn't complete
  if (!session.gym || !session.gym.id) {
    return <Redirect href="/(onboarding)/owner/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: 'Panel de Control',
          tabBarIcon: ({ color, size }) => (
            <Icon as={HomeIcon} style={{ color, width: size, height: size }} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
          headerTitle: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <Icon as={UsersIcon} style={{ color, width: size, height: size }} />
          ),
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contratos',
          headerTitle: 'Contratos',
          tabBarIcon: ({ color, size }) => (
            <Icon as={FileTextIcon} style={{ color, width: size, height: size }} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Más',
          headerTitle: 'Más opciones',
          tabBarIcon: ({ color, size }) => (
            <Icon as={MenuIcon} style={{ color, width: size, height: size }} />
          ),
        }}
      />
    </Tabs>
  );
}