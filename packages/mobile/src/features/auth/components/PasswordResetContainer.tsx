import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon } from 'lucide-react-native';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';

interface PasswordResetContainerProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps?: number;
  title: string;
  onBackPress?: () => void;
}

export function PasswordResetContainer({
  children,
  currentStep,
  totalSteps = 3,
  title,
  onBackPress,
}: PasswordResetContainerProps) {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const progressValue = (currentStep / totalSteps) * 100;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-4 mt-4">
            {/* Header */}
            <HStack className="items-center justify-between mb-6">
              <Pressable onPress={handleBackPress}>
                <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
              </Pressable>
              <Text className="text-gray-600">
                Paso {currentStep} de {totalSteps}
              </Text>
            </HStack>

            {/* Progress bar */}
            <Progress value={progressValue} className="mb-6">
              <ProgressFilledTrack />
            </Progress>

            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 mb-2">{title}</Text>

            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}