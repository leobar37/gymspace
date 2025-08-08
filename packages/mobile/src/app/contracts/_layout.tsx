import { Stack, router } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { ChevronLeftIcon } from 'lucide-react-native';

export default function ContractsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: '#374151',
        animation: 'slide_from_right',
        headerBackTitle: ' ',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Contratos',
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              className="p-2 -ml-2"
            >
              <Icon as={ChevronLeftIcon} className="w-6 h-6 text-gray-700" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalle de Contrato',
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar Contrato',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]/renew"
        options={{
          title: 'Renovar Contrato',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Nuevo Contrato',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}