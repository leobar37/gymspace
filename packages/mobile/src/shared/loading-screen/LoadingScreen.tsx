import React from 'react';
import { View, Text, ActivityIndicator, Modal } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { useLoadingScreenStore } from './store';
import { CheckCircle, XCircle } from 'lucide-react-native';

export const LoadingScreen: React.FC = () => {
  const { state, message, actions } = useLoadingScreenStore();

  if (state === 'idle') {
    return null;
  }

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
            {message && (
              <Text className="text-gray-700 text-base text-center mt-4">
                {message}
              </Text>
            )}
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
              <Text className="text-gray-700 text-base text-center mt-2 px-4">
                {message}
              </Text>
            )}
            {actions.length > 0 && (
              <View className="mt-6 w-full px-6">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'solid'}
                    onPress={action.onPress}
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

  return (
    <Modal
      visible={state !== 'idle'}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-2xl p-8 m-6 min-w-[280px] max-w-[90%] items-center shadow-xl">
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};