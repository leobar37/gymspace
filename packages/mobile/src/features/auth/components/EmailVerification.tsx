import { ButtonText, Button as GluestackButton } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthController } from '@/features/auth/controllers/auth.controller';
import { PinInput } from '@/shared/components/PinInput';
import { useRouter } from 'expo-router';
import { MailIcon, RefreshCwIcon } from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { Pressable } from 'react-native';
interface EmailVerificationProps {
  email: string;
  onSuccess?: () => void;
  onBack?: () => void;
  title?: string;
  description?: string;
}

export function EmailVerification({
  email,
  onSuccess,
  onBack,
  title = 'Verifica tu correo',
  description = 'Hemos enviado un código de verificación a',
}: EmailVerificationProps) {
  const router = useRouter();
  const { isVerifying, resendVerification, isResending, verifyEmailAsync } = useAuthController();
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(1);
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

  const handleVerify = useCallback(async () => {
    if (code.length === 6) {
      try {
        console.log("verify the email", {
          email,
          code
        });
        await verifyEmailAsync({
          email: email,
          code: code,
        });
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  }, [code, email]);

  const handleResend = () => {
    if (canResend) {
      setResendTimer(60);
      setCanResend(false);
      resendVerification({
        email: email,
      });
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
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
          {title}
        </Heading>
        <Text className="text-gray-600 text-lg text-center">
          {description}
        </Text>
        <Text className="text-gray-900 font-medium">{email}</Text>
      </VStack>

      {/* PIN Input */}
      <VStack className="gap-6">
        <PinInput
          value={code}
          onChange={setCode}
          onComplete={handleVerify}
          disabled={isVerifying}
          error={false}
        />

        {/* Resend section */}
        <Center>
          {canResend ? (
            <Pressable onPress={handleResend} disabled={isResending}>
              <HStack className="items-center gap-1">
                <Icon
                  as={RefreshCwIcon}
                  className={`w-4 h-4 ${isResending ? 'text-gray-400' : 'text-blue-500'}`}
                />
                <Text className={`font-medium ${isResending ? 'text-gray-400' : 'text-blue-500'}`}>
                  {isResending ? 'Reenviando...' : 'Reenviar código'}
                </Text>
              </HStack>
            </Pressable>
          ) : (
            <Text className="text-gray-600">Reenviar código en {resendTimer}s</Text>
          )}
        </Center>
      </VStack>

      {/* Buttons */}
      <VStack className="gap-3 mt-auto">
        <GluestackButton
          onPress={handleVerify}
          disabled={code.length !== 6 || isVerifying}
          className="py-3 px-6 w-full"
        >
          <ButtonText>{isVerifying ? 'Verificando...' : 'Verificar código'}</ButtonText>
        </GluestackButton>
        <Center>
          <Pressable onPress={handleBack}>
            <Text className="text-gray-600">Cambiar correo electrónico</Text>
          </Pressable>
        </Center>
      </VStack>
    </VStack>
  );
}