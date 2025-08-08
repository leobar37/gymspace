import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContractsList } from '@/features/contracts/components/ContractsList';

export default function ContractsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ContractsList />
    </SafeAreaView>
  );
}