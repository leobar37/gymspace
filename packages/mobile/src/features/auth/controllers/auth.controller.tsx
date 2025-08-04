import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { userAtom, type User } from '@/shared/stores/auth.store';
import type { ResendVerificationDto, VerifyEmailDto } from '@gymspace/sdk';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import React from 'react';

export const useAuthController = () => {
  const { sdk: gymSpaceSDK } = useGymSdk();
  const router = useRouter();
  const userAtomResult = useAtom(userAtom);
  const setUser: (user: User | null) => void = userAtomResult[1];

  const toast = useToast();

  // Email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: (data: VerifyEmailDto) => gymSpaceSDK.auth.verifyEmail(data),
    onSuccess: (response) => {
      // Show success toast

      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Email Verificado</ToastTitle>
              <ToastDescription>
                Tu email ha sido verificado exitosamente
              </ToastDescription>
            </Toast>
          );
        },
      });

      // Navigation is handled by the parent component via onSuccess callback
    },
    onError: (error: any) => {
      // Show error toast
      toast.show({
        placement: 'top',
        duration: 4000,
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Error de Verificación</ToastTitle>
              <ToastDescription>
                {error.response?.data?.message || 'Código inválido o expirado'}
              </ToastDescription>
            </Toast>
          );
        },
      });
    },
  });

  // Resend verification code mutation
  const resendVerificationMutation = useMutation({
    mutationFn: (data: ResendVerificationDto) => gymSpaceSDK.auth.resendVerification(data),
    onSuccess: () => {
      // Show success toast
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="info" variant="solid">
              <ToastTitle>Código Reenviado</ToastTitle>
              <ToastDescription>
                Hemos enviado un nuevo código a tu correo
              </ToastDescription>
            </Toast>
          );
        },
      });
    },
    onError: (error: any) => {
      console.log("error", error);

      // Show error toast
      toast.show({
        placement: 'top',
        duration: 4000,
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Error al Reenviar</ToastTitle>
              <ToastDescription>
                {error.response?.data?.message || 'No se pudo reenviar el código'}
              </ToastDescription>
            </Toast>
          );
        },
      });
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => gymSpaceSDK.auth.login(data),
    onSuccess: (response) => {
      // Store user info
      setUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        userType: response.user.userType,
      });

      // Navigate based on user type
      if (response.redirectPath) {
        router.replace(response.redirectPath as any);
      } else {
        router.replace('/(app)/_layout');
      }
    },
    onError: (error: any) => {
      toast.show({
        placement: 'top',
        duration: 4000,
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Error de Inicio de Sesión</ToastTitle>
              <ToastDescription>
                {error.response?.data?.message || 'Credenciales inválidas'}
              </ToastDescription>
            </Toast>
          );
        },
      });
    },
  });

  return {
    // Email verification
    verifyEmail: verifyEmailMutation.mutate,
    isVerifying: verifyEmailMutation.isPending,
    verifyError: verifyEmailMutation.error,
    verifyEmailAsync: verifyEmailMutation.mutateAsync,

    // Resend verification
    resendVerification: resendVerificationMutation.mutate,
    isResending: resendVerificationMutation.isPending,
    resendError: resendVerificationMutation.error,
    resendVerificationAsync: resendVerificationMutation.mutateAsync,

    // Login
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    loginAsync: loginMutation.mutateAsync,
  };
};