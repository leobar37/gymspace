import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native';
import { CreateContractForm } from '@/features/contracts/components/CreateContractForm';

export default function CreateContractScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nuevo Contrato',
          headerBackTitle: 'Cancelar',
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <CreateContractForm />
      </SafeAreaView>
    </>
  );
}