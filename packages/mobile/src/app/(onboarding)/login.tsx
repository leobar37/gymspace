import { Logo } from '@/components/Logo';
import {
  FormCheckbox,
  FormInput,
  FormProvider,
  useForm,
  zodResolver
} from '@/components/forms';
import { ButtonSpinner, ButtonText, Button as GluestackButton } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, View } from 'react-native';
import { z } from 'zod';
import { useAuthToken } from '@/hooks/useAuthToken';

// Login schema
const loginSchema = z.object({
  email: z.string()
    .min(1, 'El correo electrónico es requerido')
    .email('Dirección de correo inválida'),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().default(false),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { sdk } = useGymSdk();
  const { storeTokens } = useAuthToken();
  const [showPassword, setShowPassword] = useState(false);

  // Initialize form
  const methods = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await sdk.auth.login({
        email: data.email,
        password: data.password,
      });
      console.log("auth responde", response);
      
      return response;
    },
    onSuccess: async (response) => {
      try {
        // Store both access and refresh tokens properly
        const success = await storeTokens({
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
        });
        
        if (!success) {
          throw new Error('Failed to store tokens');
        }
        
        // Navigate to main app - the app layout will handle checking if user has completed onboarding
        router.replace('/(app)');
      } catch (error) {
        console.error('Error storing auth tokens:', error);
        methods.setError('email', { 
          message: 'Error al guardar la sesión. Inténtalo de nuevo.' 
        });
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      
      // Handle different error types from the SDK
      let message = 'Error de inicio de sesión. Inténtalo de nuevo.';
      
      if (error.message) {
        // SDK errors have a message property
        message = error.message;
      } else if (error.response?.data?.message) {
        // Axios/HTTP errors
        message = error.response.data.message;
      }
      
      // Translate common error messages to Spanish
      if (message.toLowerCase().includes('invalid credentials') || 
          message.toLowerCase().includes('unauthorized')) {
        message = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      } else if (message.toLowerCase().includes('user not found')) {
        message = 'Usuario no encontrado. Verifica tu correo electrónico.';
      } else if (message.toLowerCase().includes('email not verified')) {
        message = 'Debes verificar tu correo electrónico antes de iniciar sesión.';
      }
      
      methods.setError('email', { message });
    },
  });

  const onSubmit = (data: LoginForm) => {
    // Clear any existing errors before attempting login
    methods.clearErrors();
    loginMutation.mutate(data);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6">
            {/* Back button */}
            <Pressable 
              onPress={() => router.back()} 
              className="pt-4 pb-2"
            >
              <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
            </Pressable>

            <VStack className="flex-1 justify-center max-w-sm w-full mx-auto gap-16">
              {/* Logo */}
              <Center className="mb-4">
                <Logo variant="sm" />
              </Center>

              {/* Header */}
              <VStack className="gap-3">
                <Heading className="text-gray-900 text-3xl font-bold">
                  ¡Bienvenido de nuevo!
                </Heading>
                <Text className="text-gray-600 text-lg">
                  Inicia sesión para continuar en GymSpace
                </Text>
              </VStack>

              {/* Form */}
              <FormProvider {...methods}>
                <VStack className="gap-4">
                  <FormInput
                    name="email"
                    label="Correo electrónico"
                    placeholder="Ingresa tu correo"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    disabled={loginMutation.isPending}
                  />

                  <FormInput
                    name="password"
                    label="Contraseña"
                    placeholder="Ingresa tu contraseña"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    disabled={loginMutation.isPending}
                  />

                  <HStack className='justify-center items-center'>
                    <FormCheckbox
                      name="rememberMe"
                      label="Recordarme"
                    />
                    
                    <Link href="/(onboarding)/forgot-password" asChild>
                      <Pressable>
                        <Text className="text-blue-500 text-sm font-medium">
                          ¿Olvidaste tu contraseña?
                        </Text>
                      </Pressable>
                    </Link>
                  </HStack>
                  <GluestackButton
                    onPress={methods.handleSubmit(onSubmit)}
                    disabled={loginMutation.isPending}
                    className="w-full mt-4"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <ButtonSpinner />
                        <ButtonText>Iniciando sesión...</ButtonText>
                      </>
                    ) : (
                      <ButtonText>Iniciar Sesión</ButtonText>
                    )}
                  </GluestackButton>
                </VStack>
              </FormProvider>

              {/* Footer */}
              <Center className="mt-8">
                <HStack className="gap-1">
                  <Text className="text-gray-600">
                    ¿No tienes una cuenta?
                  </Text>
                  <Link href="/(onboarding)" asChild>
                    <Pressable>
                      <Text className="text-blue-500 font-medium">
                        Regístrate
                      </Text>
                    </Pressable>
                  </Link>
                </HStack>
              </Center>
            </VStack>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}