import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon } from 'lucide-react-native';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, View } from 'react-native';
import { z } from 'zod';
import {
  FormInput,
  FormProvider,
  useForm,
  zodResolver
} from '../../../components/forms';
import {
  Box,
  GluestackButton as Button,
  ButtonText,
  HStack,
  Heading,
  Icon,
  Progress,
  ProgressFilledTrack,
  Text,
  VStack
} from '../../../components/ui';
import { useOnboardingStore } from '@/store/onboarding';

// Validation schema
const securityInfoSchema = z.object({
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ['confirmPassword'],
});

type SecurityInfoForm = z.infer<typeof securityInfoSchema>;

export default function OwnerSecurityInfoScreen() {
  const { setOwnerData, ownerData } = useOnboardingStore();

  // Initialize form
  const methods = useForm<SecurityInfoForm>({
    resolver: zodResolver(securityInfoSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: SecurityInfoForm) => {
    // Store data in global state
    setOwnerData({
      ...ownerData,
      password: data.password,
    });
    
    // Navigate to email verification
    router.push('/owner/email-verification');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-4">
            {/* Header */}
            <HStack className="items-center justify-between mb-6">
              <Pressable onPress={() => router.back()}>
                <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
              </Pressable>
              <Text className="text-gray-600">Paso 3 de 3</Text>
            </HStack>

            {/* Progress bar */}
            <Progress value={100} className="mb-8">
              <ProgressFilledTrack />
            </Progress>

            <VStack className="flex-1 gap-8">
              {/* Title */}
              <VStack className="gap-3">
                <Heading className="text-gray-900 text-3xl font-bold">
                  Crea tu Contraseña
                </Heading>
                <Text className="text-gray-600 text-lg">
                  Protege tu cuenta con una contraseña segura
                </Text>
              </VStack>

              {/* Form */}
              <FormProvider {...methods}>
                <VStack className="gap-6">
                  <FormInput
                    name="password"
                    label="Contraseña"
                    placeholder="Mínimo 8 caracteres"
                    secureTextEntry
                    autoComplete="new-password"
                    returnKeyType="next"
                    autoFocus
                  />

                  <FormInput
                    name="confirmPassword"
                    label="Confirmar contraseña"
                    placeholder="Repite tu contraseña"
                    secureTextEntry
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={methods.handleSubmit(onSubmit)}
                  />
                </VStack>
              </FormProvider>

              {/* Password requirements */}
              <VStack className="gap-2 bg-gray-50 p-4 rounded-lg">
                <Text className="text-sm font-medium text-gray-700">Tu contraseña debe tener:</Text>
                <Text className="text-sm text-gray-600">• Al menos 8 caracteres</Text>
                <Text className="text-sm text-gray-600">• Una letra mayúscula</Text>
                <Text className="text-sm text-gray-600">• Una letra minúscula</Text>
                <Text className="text-sm text-gray-600">• Un número</Text>
              </VStack>

              {/* Continue button */}
              <Box className="mt-auto pb-8">
                <Button
                  onPress={methods.handleSubmit(onSubmit)}
                  className="w-full py-3 px-6 bg-blue-600 rounded-lg"
                >
                  <ButtonText className="text-white font-semibold text-center">Continuar</ButtonText>
                </Button>
              </Box>
            </VStack>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}