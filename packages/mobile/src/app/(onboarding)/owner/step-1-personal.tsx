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
} from '@/components/forms';
import { Box } from '@/components/ui/box';
import { Button as GluestackButton, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useOnboardingStore } from '@/store/onboarding';

// Validation schema
const personalInfoSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().min(2, 'Correo electrónico inválido'),
});

type PersonalInfoForm = z.infer<typeof personalInfoSchema>;

export default function OwnerPersonalInfoScreen() {
  const { setOwnerData, ownerData } = useOnboardingStore();

  // Initialize form
  const methods = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: ownerData?.name || '',
      email: ownerData?.email || '',
    },
  });

  const onSubmit = (data: PersonalInfoForm) => {
    // Store data in global state
    setOwnerData({
      ...ownerData,
      name: data.name,
      email: data.email,
    });

    // Navigate to next step
    router.push('/owner/step-2-contact');
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
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-4">
            {/* Header */}
            <HStack className="items-center justify-between mb-6">
              <Pressable onPress={() => router.back()}>
                <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
              </Pressable>
              <Text className="text-gray-600">Paso 1 de 4</Text>
            </HStack>

            {/* Progress bar */}
            <Progress value={25} className="mb-8">
              <ProgressFilledTrack />
            </Progress>

            <VStack className="flex-1 gap-8">
              {/* Title */}
              <VStack className="gap-3">
                <Heading className="text-gray-900 text-3xl font-bold">
                  Información Personal
                </Heading>
                <Text className="text-gray-600 text-lg">
                  ¿Cómo te llamas y cuál es tu correo?
                </Text>
              </VStack>

              {/* Form */}
              <FormProvider {...methods}>
                <VStack className="gap-6">
                  <FormInput
                    name="name"
                    label="Nombre completo"
                    placeholder="Juan Pérez"
                    autoComplete="name"
                    returnKeyType="next"
                    autoFocus
                  />

                  <FormInput
                    name="email"
                    label="Correo electrónico"
                    placeholder="correo@ejemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="done"
                    onSubmitEditing={methods.handleSubmit(onSubmit)}
                  />
                </VStack>
              </FormProvider>

              {/* Continue button */}
              <Box>
                <GluestackButton
                  onPress={methods.handleSubmit(onSubmit)}
                >
                  <ButtonText>Continuar</ButtonText>
                </GluestackButton>
              </Box>
            </VStack>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}