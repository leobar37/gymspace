import React, { Fragment } from 'react';

import { CreateContractForm } from '@/features/contracts/components/CreateContractForm';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateContractScreen() {
  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-white">
      <CreateContractForm />
    </SafeAreaView>
  );
}
