import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, View } from 'react-native';
import { z } from 'zod';
import {
  FormCheckbox,
  FormInput,
  FormProvider,
  useForm,
  zodResolver
} from '../../components/forms';
import {
  GluestackButton as Button,
  ButtonSpinner,
  ButtonText,
  Center,
  Heading,
  HStack,
  Icon,
  Logo,
  Text,
  VStack
} from '../../components/ui';
import { useGymSdk } from '@/providers/GymSdkProvider';

// Registration schema
const registerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { } = useGymSdk();
  const [showPassword] = useState(false);

  // Initialize form
  const methods = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationName: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      // For now, just navigate to the new onboarding flow
      // The actual registration will happen at the end of onboarding
      router.push('/(onboarding)/owner/basic-info');
      return { success: true };
    },
    onSuccess: async () => {
      // Navigation is handled in the mutation function
    },
    onError: (error: any) => {
      // Show error to user
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      methods.setError('email', { message });
    },
  });

  const onSubmit = () => {
    registerMutation.mutate();
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
          <View className="flex-1 px-6 py-4">
            {/* Back button */}
            <Pressable 
              onPress={() => router.back()} 
              className="pb-2"
            >
              <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
            </Pressable>

            <VStack className="max-w-sm w-full mx-auto gap-12">
              {/* Logo */}
              <Center className="mb-2">
                <Logo variant="sm" />
              </Center>

              {/* Header */}
              <VStack className="gap-2">
                <Heading className="text-gray-900 text-3xl font-bold">
                  Create account
                </Heading>
                <Text className="text-gray-600 text-lg">
                  Start managing your gym with GymSpace
                </Text>
              </VStack>

              {/* Form */}
              <FormProvider {...methods}>
                <VStack className="gap-4">
                  <FormInput
                    name="organizationName"
                    label="Organization Name"
                    placeholder="Your gym or fitness center name"
                    autoComplete="organization"
                  />

                  <FormInput
                    name="name"
                    label="Full Name"
                    placeholder="John Doe"
                    autoComplete="name"
                  />

                  <FormInput
                    name="phone"
                    label="Phone"
                    placeholder="+1 234 567 8900"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />

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
                    placeholder="Create a strong password"
                    description="At least 8 characters with uppercase, lowercase and numbers"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                  />

                  <FormInput
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                  />

                  <FormCheckbox
                    name="acceptTerms"
                    label="I agree to the Terms of Service and Privacy Policy"
                  />

                  <Button
                    onPress={methods.handleSubmit(onSubmit)}
                    disabled={registerMutation.isPending}
                    className="w-full mt-4"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <ButtonSpinner />
                        <ButtonText>Creating account...</ButtonText>
                      </>
                    ) : (
                      <ButtonText>Create Account</ButtonText>
                    )}
                  </Button>
                </VStack>
              </FormProvider>

              {/* Footer */}
              <Center className="mt-6 mb-4">
                <HStack className="gap-1">
                  <Text className="text-gray-600">
                    Already have an account?
                  </Text>
                  <Link href="/(onboarding)/login" asChild>
                    <Pressable>
                      <Text className="text-blue-500 font-medium">
                        Sign in
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