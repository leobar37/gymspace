import { useEffect, useState } from 'react';
import { useLoadingScreenStore } from '../store';

export type LoadingScreenStep = 'loading' | 'success' | 'error';

/**
 * Hook that manages the LoadingScreen state logic
 * Separates state management from UI components
 */
export const useLoadingScreenState = () => {
  const { state, message, actions, hide } = useLoadingScreenStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<LoadingScreenStep>('loading');

  // Update current step when state changes
  useEffect(() => {
    if (state !== 'idle') {
      setCurrentStep(state as LoadingScreenStep);
    }
  }, [state]);

  // Control visibility based on state
  useEffect(() => {
    setIsOpen(state !== 'idle');
  }, [state]);

  const handleActionPress = (action: typeof actions[0]) => {
    // First hide the sheet
    setIsOpen(false);
    hide();
    // Then execute the action after a small delay to ensure sheet is closed
    setTimeout(() => {
      action.onPress();
    }, 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    hide();
  };

  return {
    // State
    isOpen,
    currentStep,
    state,
    message,
    actions,

    // Handlers
    handleActionPress,
    handleClose,

    // Control
    setIsOpen,
    hide,
  };
};