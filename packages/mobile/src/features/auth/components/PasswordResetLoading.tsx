import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { SafeAreaView } from 'react-native';

interface PasswordResetLoadingProps {
  message?: string;
}

export function PasswordResetLoading({ message = 'Cargando...' }: PasswordResetLoadingProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        <VStack className="items-center gap-4">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 text-center">{message}</Text>
        </VStack>
      </View>
    </SafeAreaView>
  );
}