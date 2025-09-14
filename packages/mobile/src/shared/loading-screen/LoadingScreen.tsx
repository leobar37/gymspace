import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLoadingScreenStore } from './store';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { MultiScreen } from '@/components/ui/multi-screen';
import { LoadingStep, SuccessStep, ErrorStep } from './screens';
import type { StepConfig } from '@/components/ui/multi-screen/types';

// Main LoadingScreen component
export const LoadingScreen: React.FC = () => {
  const { state, message, actions, hide } = useLoadingScreenStore();
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const [currentStep, setCurrentStep] = useState<'loading' | 'success' | 'error'>('loading');

  // Update current step when state changes
  useEffect(() => {
    if (state !== 'idle') {
      setCurrentStep(state);
    }
  }, [state]);

  const handleActionPress = (action: typeof actions[0]) => {
    // First hide the sheet
    hide();
    // Then execute the action after a small delay to ensure sheet is closed
    setTimeout(() => {
      action.onPress();
    }, 100);
  };

  // Wrapper components for each step
  const LoadingStepWrapper: React.FC = () => {
    return <LoadingStep message={message} />;
  };

  const SuccessStepWrapper: React.FC = () => {
    return <SuccessStep message={message} actions={actions} onActionPress={handleActionPress} />;
  };

  const ErrorStepWrapper: React.FC = () => {
    return <ErrorStep message={message} actions={actions} onActionPress={handleActionPress} />;
  };

  // Define steps for MultiScreen
  const steps: StepConfig[] = useMemo(() => [
    { id: 'loading', component: LoadingStepWrapper },
    { id: 'success', component: SuccessStepWrapper },
    { id: 'error', component: ErrorStepWrapper },
  ], [message, actions]);

  useEffect(() => {
    if (state !== 'idle') {
      actionSheetRef.current?.show();
    } else {
      actionSheetRef.current?.hide();
    }
  }, [state]);

  // Handle closing the sheet when hide is called
  const handleClose = () => {
    hide();
  };

  // Don't render the ActionSheet when idle
  if (state === 'idle') {
    return null;
  }

  return (
    <ActionSheet
      id={'loading-screen'}
      ref={actionSheetRef}
      containerStyle={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 0,
        minWidth: 280,
        maxWidth: '90%',
        alignSelf: 'center',
      }}
      backgroundInteractionEnabled={false}
      overdrawEnabled={false}
      defaultOverlayOpacity={0.5}
      gestureEnabled={false}
      closeOnPressBack={false}
      closeOnTouchBackdrop={false}
      indicatorStyle={{
        width: 0,
        height: 0,
      }}
      isModal={true}
      statusBarTranslucent
      drawUnderStatusBar
      onClose={handleClose}
    >
      <View className="min-h-[200px]">
        <MultiScreen 
          steps={steps} 
          config={{ defaultStep: currentStep }}
        />
      </View>
    </ActionSheet>
  );
};