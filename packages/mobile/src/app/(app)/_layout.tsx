import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import {
  HomeIcon,
  UsersIcon,
  FileTextIcon,
  MenuIcon,
} from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useAtom } from 'jotai';
import { currentTabAtom } from '@/store/atoms';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { Redirect } from 'expo-router';

export default function AppLayout() {
  const { isAuthenticated } = useGymSdk();
  const [currentTab, setCurrentTab] = useAtom(currentTabAtom);

  // If user is not authenticated, redirect to onboarding
  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)" />;
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