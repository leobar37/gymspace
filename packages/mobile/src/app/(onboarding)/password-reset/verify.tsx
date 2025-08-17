import React, { useState, useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Shield, RefreshCcw } from 'lucide-react-native';

import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { PinInput } from '@/shared/components/PinInput';
import { PasswordResetContainer } from '@/features/auth/components/PasswordResetContainer';
import { usePasswordResetStore } from '@/features/auth/stores/passwordResetStore';
import { PasswordResetLoading } from '@/features/auth/components/PasswordResetLoading';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { Icon } from '@/components/ui/icon';

const verifyCodeSchema = z.object({
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
});

type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;

export default function PasswordResetVerifyScreen() {
  const { email, setResetToken, setStep } = usePasswordResetStore();
  const { sdk } = useGymSdk();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [hasError, setHasError] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmittedCode = useRef<string>('');

  useEffect(() => {
    if (!email) {
      router.replace('/password-reset/request');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email]);

  const form = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: '',
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (codeValue: string) => {
      // Validate email exists
      if (!email) {
        throw new Error('Email no disponible. Por favor, regresa al paso anterior.');
      }
      
      console.log('Verifying code with:', { email, code: codeValue });
      
      try {
        const response = await sdk.auth.verifyResetCode({
          email,
          code: codeValue,
        });
        console.log('Verification response:', response);
        return response;
      } catch (error: any) {
        console.error('Verify code error:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });
        throw error;
      }
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
    onSuccess: (response) => {
      // Only proceed if we have a valid response with resetToken
      if (response && response.resetToken) {
        // Clear the code to prevent any further submissions
        setCode('');
        lastSubmittedCode.current = '';
        
        setResetToken(response.resetToken, response.expiresIn);
        setStep('reset');
        toast.show({
          placement: 'top',
          duration: 3000,
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Código verificado</ToastTitle>
              <ToastDescription>Ahora puedes crear tu nueva contraseña</ToastDescription>
            </Toast>
          ),
        });
        router.push('/password-reset/reset');
      } else {
        // Invalid response structure
        console.error('Invalid response from server:', response);
        setHasError(true);
        setCode('');
        toast.show({
          placement: 'top',
          duration: 3000,
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>Respuesta inválida del servidor</ToastDescription>
            </Toast>
          ),
        });
      }
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      
      // Reset the last submitted code so user can retry
      lastSubmittedCode.current = '';
      
      // Extract error message
      let message = 'Código inválido o expirado';
      
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        if (Array.isArray(errors) && errors.length > 0) {
          message = errors[0].message || errors[0].msg || message;
        }
      } else if (error?.message) {
        message = error.message;
      }
      
      setHasError(true);
      setCode(''); // Clear the PIN input on error
      
      toast.show({
        placement: 'top',
        duration: 5000, // Show longer for errors
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>{message}</ToastDescription>
          </Toast>
        ),
      });
    },
  });

  const resendCodeMutation = useMutation({
    mutationFn: () => {
      return sdk.auth.resendResetCode({ email });
    },
    onSuccess: () => {
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="solid">
            <ToastTitle>Código reenviado</ToastTitle>
            <ToastDescription>Revisa tu correo electrónico nuevamente</ToastDescription>
          </Toast>
        ),
      });
      setCanResend(false);
      setResendTimer(60);
      setCode('');
      setHasError(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'No se pudo reenviar el código';
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

  const handleCodeComplete = (codeValue: string) => {
    // Don't submit if already processing or submitting
    if (verifyCodeMutation.isPending || isSubmitting) {
      return;
    }
    
    // Prevent submitting the same code twice
    if (lastSubmittedCode.current === codeValue) {
      return;
    }
    
    // Validate code length
    if (codeValue.length !== 6) {
      setHasError(true);
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>El código debe tener 6 dígitos</ToastDescription>
          </Toast>
        ),
      });
      return;
    }
    
    // Store the code being submitted
    lastSubmittedCode.current = codeValue;
    setHasError(false);
    verifyCodeMutation.mutate(codeValue);
  };
  
  const handleCodeChange = (value: string) => {
    setCode(value);
    setHasError(false);
    form.setValue('code', value);
    
    // Reset last submitted code when user modifies the input
    if (value.length < 6 && lastSubmittedCode.current) {
      lastSubmittedCode.current = '';
    }
  };

  const handleResend = () => {
    if (canResend) {
      resendCodeMutation.mutate();
    }
  };

  if (verifyCodeMutation.isPending) {
    return <PasswordResetLoading message="Verificando código..." />;
  }

  return (
    <PasswordResetContainer
      currentStep={2}
      title="Verificación de código"
      onBackPress={() => {
        setStep('request');
        router.back();
      }}
    >
      <FormProvider {...form}>
        <VStack className="gap-6 mt-4">
          <Text className="text-gray-600">
            Ingresa el código de 6 dígitos que enviamos a{' '}
            <Text className="font-semibold">{email}</Text>
          </Text>

          <VStack className="gap-3">
            <HStack className="items-center gap-2">
              <Icon as={Shield} className="text-gray-500 w-5 h-5" />
              <Text className="font-medium text-gray-900">Código de verificación</Text>
            </HStack>
            <PinInput
              length={6}
              value={code}
              onChange={handleCodeChange}
              onComplete={handleCodeComplete}
              error={hasError}
              disabled={verifyCodeMutation.isPending}
            />
          </VStack>

          <HStack className="items-center justify-center gap-2">
            <Text className="text-gray-600">¿No recibiste el código?</Text>
            {canResend ? (
              <Button
                variant="link"
                size="sm"
                onPress={handleResend}
                disabled={resendCodeMutation.isPending}
              >
                <Icon as={RefreshCcw} className="text-blue-600 w-4 h-4 mr-1" />
                <ButtonText className="text-blue-600">Reenviar código</ButtonText>
              </Button>
            ) : (
              <Text className="text-gray-500">
                Reenviar en {resendTimer}s
              </Text>
            )}
          </HStack>

        </VStack>
      </FormProvider>
    </PasswordResetContainer>
  );
}