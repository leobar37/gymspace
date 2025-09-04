import { Stack } from 'expo-router';
import React, { Fragment } from 'react';

import { CreateContractForm } from '@/features/contracts/components/CreateContractForm';

export default function CreateContractScreen() {
  return (
    <Fragment>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <CreateContractForm />
    </Fragment>
  );
}
