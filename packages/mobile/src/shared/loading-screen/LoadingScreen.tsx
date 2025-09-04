import React, { useRef, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { useLoadingScreenStore } from './store';
import { CheckCircle, XCircle } from 'lucide-react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';

export const LoadingScreen: React.FC = () => {
  const { state, message, actions, hide } = useLoadingScreenStore();
  const actionSheetRef = useRef<ActionSheetRef>(null);

  useEffect(() => {
    if (state !== 'idle') {
      actionSheetRef.current?.show();
    } else {
      actionSheetRef.current?.hide();
    }
  }, [state]);

  const handleActionPress = (action: (typeof actions)[0]) => {
    // First hide the sheet
    actionSheetRef.current?.hide();
    // Then execute the action after a small delay to ensure sheet is closed
    setTimeout(() => {
      action.onPress();
    }, 100);
  };

  const renderIcon = () => {
    switch (state) {
      case 'success':
        return <CheckCircle size={64} color="#10b981" />;
      case 'error':
        return <XCircle size={64} color="#ef4444" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            <ActivityIndicator size="large" color="#6366f1" />
            {message && <Text className="text-gray-700 text-base text-center mt-4">{message}</Text>}
          </>
        );

      case 'success':
      case 'error':
        return (
          <>
            {renderIcon()}
            <Text
              className={`text-lg font-semibold text-center mt-4 ${
                state === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {state === 'success' ? '¡Éxito!' : 'Error'}
            </Text>
            {message && (
              <Text className="text-gray-700 text-base text-center mt-2 px-4">{message}</Text>
            )}
            {actions.length > 0 && (
              <View className="mt-6 w-full px-6">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'solid'}
                    onPress={() => handleActionPress(action)}
                    className={index > 0 ? 'mt-3' : ''}
                  >
                    <ButtonText>{action.label}</ButtonText>
                  </Button>
                ))}
              </View>
            )}
          </>
        );

      default:
        return null;
    }
  };

  // Handle closing the sheet when hide is called
  const handleClose = () => {
    hide();
  };

  return (
    <ActionSheet
      id={'action'}
      ref={actionSheetRef}
      containerStyle={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 32,
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
      <View className="items-center">{renderContent()}</View>
    </ActionSheet>
  );
};
