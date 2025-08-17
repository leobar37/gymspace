import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { FormInput } from '@/components/forms/FormInput';
import { PasswordResetContainer } from '@/features/auth/components/PasswordResetContainer';
import { usePasswordResetStore } from '@/features/auth/stores/passwordResetStore';
import { PasswordResetLoading } from '@/features/auth/components/PasswordResetLoading';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { Icon } from '@/components/ui/icon';

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function PasswordResetNewPasswordScreen() {
  const { resetToken, reset } = usePasswordResetStore();
  const { sdk } = useGymSdk();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Redirect to request page if no reset token is available
    if (!resetToken) {
      router.replace('/password-reset/request');
    }
  }, [resetToken]);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordFormData) => {
      if (!resetToken) {
        throw new Error('Token de restablecimiento no válido');
      }
      return sdk.auth.resetPassword({
        resetToken,
        newPassword: data.newPassword,
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        setSuccess(true);
        toast.show({
          placement: 'top',
          duration: 3000,
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Contraseña actualizada</ToastTitle>
              <ToastDescription>Tu contraseña ha sido restablecida exitosamente</ToastDescription>
            </Toast>
          ),
        });

        // Clear store and redirect to login after a short delay
        setTimeout(() => {
          reset();
          router.replace('/login');
        }, 2000);
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error.message || 'No se pudo restablecer la contraseña';
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>{message}</ToastDescription>
          </Toast>
        ),
      });
    },
  });

  const handleSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(data);
  };

  // Return null while redirecting to prevent render
  if (!resetToken) {
    return null;
  }

  if (resetPasswordMutation.isPending) {
    return <PasswordResetLoading message="Actualizando contraseña..." />;
  }

  if (success) {
    return (
      <PasswordResetContainer currentStep={3} title="¡Contraseña actualizada!">
        <VStack className="gap-6 mt-8 items-center">
          <Icon as={CheckCircle} className="text-green-600 w-20 h-20" />
          <Text className="text-center text-gray-600 text-lg">
            Tu contraseña ha sido restablecida exitosamente. Serás redirigido al inicio de sesión...
          </Text>
        </VStack>
      </PasswordResetContainer>
    );
  }

  return (
    <PasswordResetContainer
      currentStep={3}
      title="Nueva contraseña"
      onBackPress={() => {
        router.back();
      }}
    >
      <FormProvider {...form}>
        <VStack className="gap-6 mt-4">
          <Text className="text-gray-600">Crea una nueva contraseña segura para tu cuenta.</Text>

          {/* Password requirements */}

          <VStack className="gap-4">
            <View className="relative">
              <FormInput
                name="newPassword"
                label="Nueva contraseña"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                leftIcon={<Icon as={Lock} className="text-gray-500 w-5 h-5" />}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-12"
              >
                <Icon as={showPassword ? EyeOff : Eye} className="text-gray-500 w-5 h-5" />
              </Pressable>
            </View>

            <View className="relative">
              <FormInput
                name="confirmPassword"
                label="Confirmar contraseña"
                placeholder="••••••••"
                secureTextEntry={!showConfirmPassword}
                leftIcon={<Icon as={Lock} className="text-gray-500 w-5 h-5" />}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-12"
              >
                <Icon as={showConfirmPassword ? EyeOff : Eye} className="text-gray-500 w-5 h-5" />
              </Pressable>
            </View>

            <VStack className="gap-2 p-4 bg-gray-50 rounded-lg">
              <Text className="text-sm font-medium text-gray-700">La contraseña debe tener:</Text>
              <HStack className="gap-2">
                <Text className="text-sm text-gray-600">• Al menos 8 caracteres</Text>
              </HStack>
              <HStack className="gap-2">
                <Text className="text-sm text-gray-600">• Una letra mayúscula</Text>
              </HStack>
              <HStack className="gap-2">
                <Text className="text-sm text-gray-600">• Una letra minúscula</Text>
              </HStack>
              <HStack className="gap-2">
                <Text className="text-sm text-gray-600">• Un número</Text>
              </HStack>
            </VStack>
          </VStack>
          
          <Button
            variant="solid"
            size="lg"
            onPress={form.handleSubmit(handleSubmit)}
            className="mt-4"
          >
            <ButtonText>Restablecer contraseña</ButtonText>
          </Button>
        </VStack>
      </FormProvider>
    </PasswordResetContainer>
  );
}
