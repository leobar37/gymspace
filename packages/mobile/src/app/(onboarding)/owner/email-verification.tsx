import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { EmailVerification } from '@/features/auth/components/EmailVerification';
import { useOnboardingStore } from '@/store/onboarding';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, SafeAreaView, View } from 'react-native';

export default function EmailVerificationScreen() {
  const { ownerData, setEmailVerified, setVerificationCode } = useOnboardingStore();

  const handleSuccess = () => {
    setEmailVerified(true);
    router.push('/(onboarding)/owner/plan-selection');
  };

  const handleBack = () => {
    router.back();
  };

  if (!ownerData?.email) {
    // Redirect back if no email data
    router.replace('/(onboarding)/owner/step-2-contact');
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 py-4">
        {/* Header */}
        <HStack className="items-center justify-between mb-6">
          <Pressable onPress={handleBack}>
            <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
          </Pressable>
          <Text className="text-gray-600">Paso 2 de 7</Text>
        </HStack>

        {/* Progress bar */}
        <Progress value={28} className="mb-8">
          <ProgressFilledTrack />
        </Progress>

        {/* Email Verification Component */}
        <EmailVerification
          email={ownerData.email}
          onSuccess={handleSuccess}
          onBack={handleBack}
        />
      </View>
    </SafeAreaView>
  );
}