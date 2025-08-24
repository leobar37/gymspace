import { Logo } from '@/components/Logo';
import { FormInput, FormPassword, FormProvider, useForm, zodResolver } from '@/components/forms';
import { ButtonText, Button as GluestackButton } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthToken } from '@/hooks/useAuthToken';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { LoadingScreen, useLoadingScreen } from '@/shared/loading-screen';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  View
} from 'react-native';
import { z } from 'zod';

// Login schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Dirección de correo inválida'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { sdk } = useGymSdk();
  const { storeTokens } = useAuthToken();
  const { execute } = useLoadingScreen();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<View>(null);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Initialize form
  const methods = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: __DEV__ ? 'admin@gymspace.pe' : '',
      password: __DEV__ ? '182@Alfk3458' : '',
    },
  });

  // Error formatter for better UX - all messages in Spanish
  const formatLoginError = (error: unknown): string => {
    let message = 'Error de inicio de sesión. Por favor, inténtalo de nuevo.';

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      if (errorObj.response?.data?.message) {
        message = errorObj.response.data.message;
      } else if (errorObj.message) {
        message = errorObj.message;
      }
    }

    // Check if message is already in Spanish
    if (
      message.includes('contraseña') ||
      message.includes('correo') ||
      message.includes('usuario') ||
      message.includes('Credenciales') ||
      message.includes('verificar') ||
      message.includes('inválid')
    ) {
      return message;
    }

    // Translate common English error messages to Spanish
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('invalid credentials') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('invalid login credentials')
    ) {
      return 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.';
    }

    if (lowerMessage.includes('user not found')) {
      return 'Usuario no encontrado. Por favor, verifica tu correo electrónico.';
    }

    if (
      lowerMessage.includes('email not confirmed') ||
      lowerMessage.includes('email not verified')
    ) {
      return 'Debes verificar tu correo electrónico antes de iniciar sesión.';
    }

    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return 'Error de conexión. Por favor, verifica tu conexión a internet e inténtalo de nuevo.';
    }

    if (lowerMessage.includes('too many requests')) {
      return 'Demasiados intentos. Por favor, espera un momento antes de intentar de nuevo.';
    }

    return 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
  };

  const onSubmit = async (data: LoginForm) => {
    // Dismiss keyboard before submitting
    Keyboard.dismiss();

    // Clear any existing errors before attempting login
    methods.clearErrors();

    const loginPromise = async () => {
      const response = await sdk.auth.login({
        email: data.email,
        password: data.password,
      });

      // Store tokens
      const success = await storeTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      if (!success) {
        throw new Error('Error al guardar la sesión. Por favor, inténtalo de nuevo.');
      }

      return response;
    };

    await execute(loginPromise(), {
      action: 'Iniciando sesión...',
      successMessage: '¡Bienvenido a GymSpace!',
      errorFormatter: formatLoginError,
      hideOnSuccess: true,
      hideDelay: 1000,
      errorActions: [
        {
          label: 'Reintentar',
          onPress: () => {
            // The modal will close and user can retry
          },
          variant: 'solid',
        },
        {
          label: 'Cerrar',
          onPress: () => {
            // Just close the modal
          },
          variant: 'outline',
        },
      ],
      onSuccess: () => {
        // Navigate after successful login
        setTimeout(() => {
          router.replace('/(app)');
        }, 1200);
      },
      onError: (error) => {
        console.error('Login error:', error);
        // Error is already handled by the loading screen
      },
    });
  };

  const handlePasswordFocus = () => {
    // Scroll to password field when focused
    setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
          },
          () => {},
        );
      }
    }, 300);
  };

  return (
    <>
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 mt-4"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            automaticallyAdjustKeyboardInsets={true}
          >
            <View className="flex-1 px-6 pt-4">
              {/* Back button */}
              <Pressable onPress={() => router.back()} className="pb-4">
                <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
              </Pressable>

              <View
                className={`flex-1 ${isKeyboardVisible ? '' : 'justify-center'} max-w-sm w-full mx-auto`}
              >
                <VStack className="gap-6">
                  {/* Logo - hide when keyboard is visible */}
                  {!isKeyboardVisible && (
                    <Center className="mb-4">
                      <Logo variant="sm" />
                    </Center>
                  )}

                  {/* Header */}
                  <VStack className="gap-2">
                    <Heading
                      className={`text-gray-900 ${isKeyboardVisible ? 'text-2xl' : 'text-3xl'} font-bold text-center`}
                    >
                      ¡Bienvenido de nuevo!
                    </Heading>
                    {!isKeyboardVisible && (
                      <Text className="text-gray-600 text-base text-center">
                        Inicia sesión para continuar
                      </Text>
                    )}
                  </VStack>

                  {/* Form */}
                  <FormProvider {...methods}>
                    <VStack className="gap-4">
                      <FormInput
                        name="email"
                        label="Correo electrónico"
                        placeholder="ejemplo@correo.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        returnKeyType="next"
                      />

                      <View ref={passwordInputRef}>
                        <FormPassword
                          name="password"
                          label="Contraseña"
                          placeholder="Tu contraseña"
                          autoComplete="password"
                          returnKeyType="done"
                          onFocus={handlePasswordFocus}
                          onSubmitEditing={methods.handleSubmit(onSubmit)}
                        />
                      </View>

                      <Center>
                        <Link href="/password-reset/request" asChild>
                          <Pressable className="py-2">
                            <Text className="text-blue-500 text-sm font-medium">
                              ¿Olvidaste tu contraseña?
                            </Text>
                          </Pressable>
                        </Link>
                      </Center>

                      <GluestackButton
                        onPress={methods.handleSubmit(onSubmit)}
                        className="w-full h-12"
                        variant="solid"
                      >
                        <ButtonText className="text-base font-medium">Iniciar Sesión</ButtonText>
                      </GluestackButton>
                    </VStack>
                  </FormProvider>

                  {/* Footer - hide when keyboard is visible */}
                  {!isKeyboardVisible && (
                    <Center className="mt-4">
                      <HStack className="gap-1">
                        <Text className="text-gray-600 text-sm">¿No tienes una cuenta?</Text>
                        <Link href="/(onboarding)" asChild>
                          <Pressable>
                            <Text className="text-blue-500 text-sm font-medium">Regístrate</Text>
                          </Pressable>
                        </Link>
                      </HStack>
                    </Center>
                  )}
                </VStack>
              </View>

              {/* Extra padding when keyboard is visible */}
              {isKeyboardVisible && <View className="h-20" />}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Loading Screen Modal */}
      <LoadingScreen />
    </>
  );
}
