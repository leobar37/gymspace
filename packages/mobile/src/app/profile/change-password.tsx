import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react-native';
import {
  FormProvider,
  FormPassword,
  useForm,
  zodResolver,
} from '@/components/forms';
import { useToast } from '@/components/ui/toast';
import { Toast, ToastTitle } from '@/components/ui/toast';
import { z } from 'zod';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useMutation } from '@tanstack/react-query';
import { useLoadingScreen } from '@/shared/loading-screen';

// Password validation schema - matching backend requirements
const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordScreen() {
  const toast = useToast();
  const { sdk } = useGymSdk();
  const { show: showLoading, hide: hideLoading } = useLoadingScreen();
  const insets = useSafeAreaInsets();

  const methods = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      showLoading('loading', 'Actualizando contraseña...');
      try {
        const result = await sdk.auth.changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
        return result;
      } finally {
        hideLoading();
      }
    },
    onSuccess: () => {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast action="success" variant="solid" id={id}>
            <ToastTitle>Contraseña actualizada exitosamente</ToastTitle>
          </Toast>
        ),
      });
      methods.reset();
      // Navigate back to profile
      router.back();
    },
    onError: (error: any) => {
      console.log("error", error);
      
      const errorMessage = error?.response?.data?.message || 'Error al cambiar la contraseña';
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast action="error" variant="solid" id={id}>
            <ToastTitle>{errorMessage}</ToastTitle>
          </Toast>
        ),
      });
    },
  });

  const handleSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cambiar Contraseña',
          headerBackTitle: 'Perfil',
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
        className="flex-1 bg-gray-50"
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets={true}
          contentContainerStyle={{
            paddingBottom: Platform.OS === 'ios' ? insets.bottom + 120 : 80,
            flexGrow: 1
          }}
        >
          <VStack className="p-4 gap-4">
            <FormProvider {...methods}>
              {/* Security Notice */}
              <Alert action="info" variant="outline">
                <AlertIcon as={AlertCircleIcon} />
                <AlertText>
                  Por seguridad, necesitamos verificar tu contraseña actual antes de cambiarla.
                </AlertText>
              </Alert>

              <Card className="p-4">
                <VStack className="gap-6">
                  {/* Current Password */}
                  <FormPassword
                    name="currentPassword"
                    label="Contraseña Actual"
                    placeholder="Ingresa tu contraseña actual"
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      // Focus next input
                      methods.setFocus('newPassword');
                    }}
                  />

                  {/* New Password */}
                  <FormPassword
                    name="newPassword"
                    label="Nueva Contraseña"
                    placeholder="Ingresa tu nueva contraseña"
                    description="Mínimo 8 caracteres, con mayúsculas, minúsculas y números"
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      // Focus next input
                      methods.setFocus('confirmPassword');
                    }}
                  />

                  {/* Confirm Password */}
                  <FormPassword
                    name="confirmPassword"
                    label="Confirmar Nueva Contraseña"
                    placeholder="Confirma tu nueva contraseña"
                    returnKeyType="done"
                    onSubmitEditing={methods.handleSubmit(handleSubmit)}
                  />
                </VStack>
              </Card>

              {/* Password Requirements */}
              <Card className="p-4">
                <VStack className="gap-3">
                  <Text className="text-sm font-medium text-gray-700">
                    Requisitos de la contraseña:
                  </Text>
                  <VStack className="gap-2">
                    <PasswordRequirement
                      met={methods.watch('newPassword')?.length >= 8}
                      text="Al menos 8 caracteres"
                    />
                    <PasswordRequirement
                      met={/[A-Z]/.test(methods.watch('newPassword') || '')}
                      text="Al menos una letra mayúscula"
                    />
                    <PasswordRequirement
                      met={/[a-z]/.test(methods.watch('newPassword') || '')}
                      text="Al menos una letra minúscula"
                    />
                    <PasswordRequirement
                      met={/[0-9]/.test(methods.watch('newPassword') || '')}
                      text="Al menos un número"
                    />
                  </VStack>
                </VStack>
              </Card>

              {/* Action Buttons */}
              <VStack className="gap-3 mt-4" style={{ 
                paddingBottom: Platform.OS === 'ios' ? insets.bottom + 60 : 40,
                marginBottom: 20
              }}>
                <Button
                  variant="solid"
                  onPress={methods.handleSubmit(handleSubmit)}
                  disabled={!methods.formState.isValid || changePasswordMutation.isPending}
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <ButtonSpinner />
                      <ButtonText className="ml-2">Actualizando...</ButtonText>
                    </>
                  ) : (
                    <ButtonText>Cambiar Contraseña</ButtonText>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onPress={() => router.back()}
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                >
                  <ButtonText>Cancelar</ButtonText>
                </Button>
              </VStack>
            </FormProvider>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

// Helper component for password requirements
interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

function PasswordRequirement({ met, text }: PasswordRequirementProps) {
  return (
    <HStack className="items-center gap-2">
      <Icon
        as={met ? CheckCircleIcon : XCircleIcon}
        className={`w-4 h-4 ${met ? 'text-green-500' : 'text-gray-400'}`}
      />
      <Text className={`text-xs ${met ? 'text-green-700' : 'text-gray-600'}`}>
        {text}
      </Text>
    </HStack>
  );
}