import React, { Fragment } from 'react';
import { Stack, useRouter } from 'expo-router';

import { CreateContractForm } from '@/features/contracts/components/CreateContractForm';
import { ScreenForm } from '@/shared/components/ScreenForm';

export default function CreateContractScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <Fragment>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScreenForm
        title="Nuevo Contrato"
        showBackButton={true}
        onBackPress={handleBack}
        showFixedFooter={true}
      >
        <CreateContractForm useFixedFooter={true} />
      </ScreenForm>
    </Fragment>
  );
}