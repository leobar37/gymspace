import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { 
  VStack, 
  HStack,
  Center,
  Heading, 
  Text, 
  GluestackButton as Button, 
  ButtonText,
  Icon,
  Progress,
  ProgressFilledTrack,
  Box
} from '@/components/ui';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon, MailIcon, RefreshCwIcon } from 'lucide-react-native';
import { useOnboardingStore } from '@/store/onboarding';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useMutation } from '@tanstack/react-query';

// Custom OTP Input component
function OTPInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <HStack className="justify-center gap-3">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Box
          key={index}
          className={`w-12 h-14 border-2 rounded-lg items-center justify-center ${
            value[index] ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <Text className="text-xl font-semibold">
            {value[index] || ''}
          </Text>
        </Box>
      ))}
    </HStack>
  );
}

export default function EmailVerificationScreen() {
  const { ownerData, setEmailVerified, setVerificationCode } = useOnboardingStore();
  const { sdk } = useGymSdk();
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Mock verification mutation
  const verifyMutation = useMutation({
    mutationFn: async (verificationCode: string) => {
      // TODO: Implement actual verification API call
      // For now, mock verification
      return new Promise((resolve) => {
        setTimeout(() => {
          if (verificationCode === '123456') {
            resolve({ success: true });
          } else {
            throw new Error('Código inválido');
          }
        }, 1000);
      });
    },
    onSuccess: () => {
      setEmailVerified(true);
      setVerificationCode(code);
      router.push('/(onboarding)/owner/plan-selection');
    },
    onError: (error: any) => {
      // Show error
      console.error('Verification error:', error);
    },
  });

  const handleResend = () => {
    setResendTimer(60);
    setCanResend(false);
    // TODO: Implement resend API call
  };

  const handleVerify = () => {
    if (code.length === 6) {
      verifyMutation.mutate(code);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 py-4">
        {/* Header */}
        <HStack className="items-center justify-between mb-6">
          <Pressable onPress={() => router.back()}>
            <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
          </Pressable>
          <Text className="text-gray-600">Paso 2 de 7</Text>
        </HStack>

        {/* Progress bar */}
        <Progress value={28} className="mb-8">
          <ProgressFilledTrack />
        </Progress>

        <VStack className="flex-1 gap-8">
          {/* Icon */}
          <Center>
            <Center className="w-20 h-20 bg-blue-100 rounded-full">
              <Icon as={MailIcon} className="text-blue-600 w-10 h-10" />
            </Center>
          </Center>

          {/* Title */}
          <VStack className="items-center gap-3">
            <Heading className="text-gray-900 text-center text-3xl font-bold">
              Verifica tu correo
            </Heading>
            <Text className="text-gray-600 text-lg text-center">
              Hemos enviado un código de verificación a
            </Text>
            <Text className="text-gray-900 font-medium">
              {ownerData?.email}
            </Text>
          </VStack>

          {/* OTP Input */}
          <VStack className="gap-6">
            <OTPInput value={code} onChange={setCode} />
            
            {/* Resend section */}
            <Center>
              {canResend ? (
                <Pressable onPress={handleResend}>
                  <HStack className="items-center gap-1">
                    <Icon as={RefreshCwIcon} className="text-blue-500 w-4 h-4" />
                    <Text className="text-blue-500 font-medium">
                      Reenviar código
                    </Text>
                  </HStack>
                </Pressable>
              ) : (
                <Text className="text-gray-600">
                  Reenviar código en {resendTimer}s
                </Text>
              )}
            </Center>
          </VStack>

          {/* Verify button */}
          <Box className="mt-auto pb-4">
            <Button
              onPress={handleVerify}
              disabled={code.length !== 6 || verifyMutation.isPending}
              className="py-3 px-6"
              className="w-full"
            >
              <ButtonText>
                {verifyMutation.isPending ? 'Verificando...' : 'Verificar código'}
              </ButtonText>
            </Button>
            
            <Center className="mt-4">
              <Pressable onPress={() => router.back()}>
                <Text className="text-gray-600">
                  Cambiar correo electrónico
                </Text>
              </Pressable>
            </Center>
          </Box>
        </VStack>
      </View>
    </SafeAreaView>
  );
}