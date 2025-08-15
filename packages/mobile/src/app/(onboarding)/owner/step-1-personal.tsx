import { router } from 'expo-router';
import React from 'react';
import { z } from 'zod';
import { FormInput, FormProvider, useForm, zodResolver } from '@/components/forms';
import { Box } from '@/components/ui/box';
import { Button as GluestackButton, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useOnboardingStore } from '@/store/onboarding';
import { OnboardingStepsContainer } from '@/features/onboarding/components/OnboardingStepsContainer';

// Validation schema
const personalInfoSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Correo electrónico inválido'),
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
    router.replace('/owner/step-2-contact');
  };

  return (
    <OnboardingStepsContainer currentStep={1} totalSteps={4}>
      <VStack className="flex-1 gap-8">
        {/* Title */}
        <VStack className="gap-3">
          <Heading className="text-gray-900 text-3xl font-bold">Información Personal</Heading>
          <Text className="text-gray-600 text-lg">¿Cómo te llamas y cuál es tu correo?</Text>
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
            disabled={!methods.formState.isValid}
            className={`${!methods.formState.isValid ? 'opacity-50' : ''}`}
          >
            <ButtonText>Continuar</ButtonText>
          </GluestackButton>
        </Box>
      </VStack>
    </OnboardingStepsContainer>
  );
}
