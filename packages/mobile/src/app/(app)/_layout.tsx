import { Icon } from '@/components/ui/icon';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { Redirect, Tabs } from 'expo-router';
import {
  FileTextIcon,
  HomeIcon,
  MenuIcon,
  UsersIcon,
  ShoppingCartIcon
} from 'lucide-react-native';
import React from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';

function AppLayout() {
  const { isAuthenticated } = useGymSdk();
  const { session, isLoading: isSessionLoading, isError } = useCurrentSession();
  // If user is not authenticated, redirect to onboarding
  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)" />;
  }

  // While loading session data, show a loading indicator instead of null
  if (isSessionLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
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
          paddingBottom: Platform.OS === 'ios' ? 30 : 20,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 95 : 75,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 5 : 3,
        },
        tabBarIconStyle: {
          marginBottom: Platform.OS === 'ios' ? -5 : -3,
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
          tabBarIcon: ({ color }) => (
            <Icon as={HomeIcon} className="w-6 h-6" style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
          headerTitle: 'Clientes',
          tabBarIcon: ({ color }) => (
            <Icon as={UsersIcon} className="w-6 h-6" style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventario',
          headerTitle: 'Inventario y Ventas',
          tabBarIcon: ({ color }) => (
            <Icon as={ShoppingCartIcon} className="w-6 h-6" style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contratos',
          headerTitle: 'Contratos',
          tabBarIcon: ({ color }) => (
            <Icon as={FileTextIcon} className="w-6 h-6" style={{ color }} />
          ),
        }}
      />

      <Tabs.Screen
        name="plans"
        options={{
          title: 'Planes',
          headerTitle: 'Planes',
          tabBarIcon: ({ color }) => (
            <Icon as={FileTextIcon} className="w-6 h-6" style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Más',
          headerTitle: 'Más opciones',
          tabBarIcon: ({ color }) => (
            <Icon as={MenuIcon} className="w-6 h-6" style={{ color }} />
          ),
        }}
      />
    </Tabs>
  );
}

export default AppLayout
