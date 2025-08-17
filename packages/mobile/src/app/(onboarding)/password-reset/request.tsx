import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Mail } from 'lucide-react-native';

import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { FormInput } from '@/components/forms/FormInput';
import { PasswordResetContainer } from '@/features/auth/components/PasswordResetContainer';
import { usePasswordResetStore } from '@/features/auth/stores/passwordResetStore';
import { PasswordResetLoading } from '@/features/auth/components/PasswordResetLoading';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { Icon } from '@/components/ui/icon';

const requestResetSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
});

type RequestResetFormData = z.infer<typeof requestResetSchema>;

export default function PasswordResetRequestScreen() {
  const { setEmail, setStep } = usePasswordResetStore();
  const { sdk } = useGymSdk();
  const toast = useToast();

  const form = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange', // Enable validation on change
  });

  const requestResetMutation = useMutation({
    mutationFn: (data: RequestResetFormData) => {
      return sdk.auth.requestPasswordReset({ email: data.email });
    },
    onSuccess: (response, variables) => {
      if (response.success) {
        setEmail(variables.email);
        setStep('verify');
        toast.show({
          placement: 'top',
          duration: 3000,
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Código enviado</ToastTitle>
              <ToastDescription>
                Revisa tu correo electrónico para el código de verificación
              </ToastDescription>
            </Toast>
          ),
        });
        router.push('/password-reset/verify');
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error.message ||
        'No se pudo enviar el código de verificación';
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

  const handleSubmit = (data: RequestResetFormData) => {
    requestResetMutation.mutate(data);
  };

  if (requestResetMutation.isPending) {
    return <PasswordResetLoading message="Enviando código de verificación..." />;
  }

  return (
    <PasswordResetContainer
      currentStep={1}
      title="Recuperar contraseña"
      onBackPress={() => router.push('/login')}
    >
      <FormProvider {...form}>
        <VStack className="gap-6 mt-4">
          <Text className="text-gray-600">
            Ingresa tu correo electrónico y te enviaremos un código de verificación para restablecer
            tu contraseña.
          </Text>

          <FormInput
            name="email"
            label="Correo electrónico"
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<Icon as={Mail} className="text-gray-500 w-5 h-5" />}
          />

          <Button
            variant="solid"
            size="lg"
            onPress={form.handleSubmit(handleSubmit)}
            isDisabled={!form.formState.isValid}
            className="mt-4"
          >
            <ButtonText>Enviar código</ButtonText>
          </Button>

          <Button variant="outline" size="lg" onPress={() => router.push('/login')}>
            <ButtonText>Volver al inicio de sesión</ButtonText>
          </Button>
        </VStack>
      </FormProvider>
    </PasswordResetContainer>
  );
}
