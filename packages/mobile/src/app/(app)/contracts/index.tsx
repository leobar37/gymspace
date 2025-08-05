import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native';
import { ContractsList } from '@/features/contracts/components/ContractsList';

export default function ContractsScreen() {
  return (
    <>
      {/* <Stack.Screen
        options={{
          title: 'Contratos',
          headerBackTitle: 'Atrás',
        }}
      /> */}
      <SafeAreaView style={{ flex: 1 }}>
        <ContractsList />
      </SafeAreaView>
    </>
  );
}