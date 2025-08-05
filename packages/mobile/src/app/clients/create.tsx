import React from 'react';
import { Stack } from 'expo-router';
import { CreateClientForm } from '@/features/clients/components/CreateClientForm';

export default function CreateClientScreen() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <CreateClientForm />
    </>
  );
}