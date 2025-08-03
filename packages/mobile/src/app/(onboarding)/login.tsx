import React, { useState } from 'react';
import { SafeAreaView, View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { 
  VStack, 
  HStack,
  Center, 
  Heading, 
  Text, 
  GluestackButton as Button, 
  ButtonText,
  ButtonSpinner,
  Box,
  Icon,
  Logo
} from '../../components/ui';
import { 
  useForm, 
  FormProvider, 
  FormInput, 
  zodResolver,
  FormCheckbox
} from '../../components/forms';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon } from 'lucide-react-native';

// Login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { sdk, setAuthToken } = useGymSdk();
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
      return response;
    },
    onSuccess: async (data) => {
      // Store auth token
      await setAuthToken(data.data.accessToken);
      
      // Navigate to main app
      router.replace('/(app)');
    },
    onError: (error: any) => {
      // Show error to user
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      methods.setError('email', { message });
    },
  });

  const onSubmit = (data: LoginForm) => {
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
                  Welcome back
                </Heading>
                <Text className="text-gray-600 text-lg">
                  Sign in to continue to GymSpace
                </Text>
              </VStack>

              {/* Form */}
              <FormProvider {...methods}>
                <VStack className="gap-4">
                  <FormInput
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />

                  <FormInput
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />

                  <HStack justifyContent="space-between" alignItems="center">
                    <FormCheckbox
                      name="rememberMe"
                      label="Remember me"
                    />
                    
                    <Link href="/(onboarding)/forgot-password" asChild>
                      <Pressable>
                        <Text className="text-blue-500 text-sm font-medium">
                          Forgot password?
                        </Text>
                      </Pressable>
                    </Link>
                  </HStack>

                  <Button
                    onPress={methods.handleSubmit(onSubmit)}
                    disabled={loginMutation.isPending}
                    className="w-full mt-4"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <ButtonSpinner />
                        <ButtonText>Signing in...</ButtonText>
                      </>
                    ) : (
                      <ButtonText>Sign In</ButtonText>
                    )}
                  </Button>
                </VStack>
              </FormProvider>

              {/* Footer */}
              <Center className="mt-8">
                <HStack className="gap-1">
                  <Text className="text-gray-600">
                    Don't have an account?
                  </Text>
                  <Link href="/(onboarding)/register" asChild>
                    <Pressable>
                      <Text className="text-blue-500 font-medium">
                        Sign up
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