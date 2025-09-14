import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface LoadingStepProps {
  message?: string;
}

export const LoadingStep: React.FC<LoadingStepProps> = ({ message }) => {
  return (
    <View className="items-center justify-center p-8">
      <ActivityIndicator size="large" color="#6366f1" />
      {message && (
        <Text className="text-gray-700 text-base text-center mt-4">
          {message}
        </Text>
      )}
    </View>
  );
};