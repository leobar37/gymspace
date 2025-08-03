import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, SafeAreaView, View } from 'react-native';
import {
  HStack,
  Icon,
  Text,
  Progress,
  ProgressFilledTrack,
} from '../../../components/ui';
import { CreateGymForm } from '../../../features/onboarding/components/CreateGymForm';

export default function CreateGymScreen() {
  const handleComplete = () => {
    // Navigation will be handled by the controller after successful creation
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4">
          <HStack className="items-center justify-between mb-6">
            <Pressable onPress={() => router.back()}>
              <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
            </Pressable>
            <Text className="text-gray-600">Último paso</Text>
          </HStack>

          {/* Progress bar */}
          <Progress value={100} className="mb-4">
            <ProgressFilledTrack />
          </Progress>
        </View>

        {/* Form */}
        <CreateGymForm onComplete={handleComplete} />
      </View>
    </SafeAreaView>
  );
}