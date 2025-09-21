import { createMultiScreen } from '@/components/ui/multi-screen/builder';
import { BottomSheetWrapper, useSheet } from '@gymspace/sheet';
import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { CheckInRegistrationScreen } from './CheckInRegistrationScreen';
import { ClientListScreen } from './ClientListScreen';

const checkInFlow = createMultiScreen()
  .addStep('client-list', ClientListScreen)
  .addStep('registration', CheckInRegistrationScreen)
  .build();

export const CheckInSheet: React.FC = () => {
  const { Component } = checkInFlow;
  const { hide } = useSheet('check-in');

  useEffect(() => {
    const onBackPress = () => {
      hide();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
    };
  }, [hide]);

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
