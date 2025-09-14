import React from 'react';
import { View, Text } from 'react-native';
import { XCircle } from 'lucide-react-native';
import { Button, ButtonText } from '@/components/ui/button';
import type { LoadingScreenAction } from '../types';

interface ErrorStepProps {
  message?: string;
  actions?: LoadingScreenAction[];
  onActionPress?: (action: LoadingScreenAction) => void;
}

export const ErrorStep: React.FC<ErrorStepProps> = ({ 
  message, 
  actions = [], 
  onActionPress 
}) => {
  return (
    <View className="items-center justify-center p-8">
      <XCircle size={64} color="#ef4444" />
      <Text className="text-lg font-semibold text-center mt-4 text-red-600">
        Error
      </Text>
      {message && (
        <Text className="text-gray-700 text-base text-center mt-2 px-4">
          {message}
        </Text>
      )}
      {actions.length > 0 && (
        <View className="mt-6 w-full">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'solid'}
              onPress={() => onActionPress?.(action)}
              className={index > 0 ? 'mt-3' : ''}
            >
              <ButtonText>{action.label}</ButtonText>
            </Button>
          ))}
        </View>
      )}
    </View>
  );
};