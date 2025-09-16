import React, { useMemo } from 'react';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent } from '@/components/ui/actionsheet';
import { LoadingStep, SuccessStep, ErrorStep } from './screens';
import { useLoadingScreenState } from './hooks/useLoadingScreenState';
import type { LoadingScreenStep } from './hooks/useLoadingScreenState';

/**
 * LoadingScreenContent Component
 *
 * Renders the appropriate step content without recreating components
 */
const LoadingScreenContent: React.FC<{
  step: LoadingScreenStep;
  message: string;
  actions: any[];
  onActionPress: (action: any) => void;
}> = ({ step, message, actions, onActionPress }) => {
  switch (step) {
    case 'loading':
      return <LoadingStep message={message} />;
    case 'success':
      return (
        <SuccessStep
          message={message}
          actions={actions}
          onActionPress={onActionPress}
        />
      );
    case 'error':
      return (
        <ErrorStep
          message={message}
          actions={actions}
          onActionPress={onActionPress}
        />
      );
    default:
      return null;
  }
};

/**
 * LoadingScreen Component
 *
 * Stable ActionSheet wrapper with dynamic content rendering
 */
export const LoadingScreen: React.FC = () => {
  const {
    isOpen,
    currentStep,
    state,
    message,
    actions,
    handleActionPress,
    handleClose,
  } = useLoadingScreenState();

  // Don't render when idle
  if (state === 'idle') {
    return null;
  }

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="min-h-[200px] p-4">
        <LoadingScreenContent
          step={currentStep}
          message={message}
          actions={actions}
          onActionPress={handleActionPress}
        />
      </ActionsheetContent>
    </Actionsheet>
  );
};