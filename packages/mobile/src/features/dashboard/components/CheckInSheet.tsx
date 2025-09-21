import { createMultiScreen } from '@/components/ui/multi-screen/builder';
import { BottomSheetWrapper } from '@gymspace/sheet';
import React from 'react';
import { CheckInRegistrationScreen } from './CheckInRegistrationScreen';
import { ClientListScreen } from './ClientListScreen';
// Create the multi-screen flow
const checkInFlow = createMultiScreen()
  .addStep('client-list', ClientListScreen)
  .addStep('registration', CheckInRegistrationScreen)
  .build();

export const CheckInSheet: React.FC = () => {
  const { Component } = checkInFlow;

  return (
    <BottomSheetWrapper 
      sheetId="check-in" 
      snapPoints={['75%', '90%']} 
      enablePanDownToClose 
      scrollable={false}
    >
      <Component />
    </BottomSheetWrapper>
  );
};
