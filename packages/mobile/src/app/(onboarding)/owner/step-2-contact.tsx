import { router } from 'expo-router';
import React from 'react';
import { z } from 'zod';
import {
  FormInput,
  FormProvider,
  useForm,
  zodResolver
} from '@/components/forms';
import { Box } from '@/components/ui/box';
import { Button as GluestackButton, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useOnboardingStore } from '@/store/onboarding';
import { OnboardingStepsContainer } from '@/features/onboarding/components/OnboardingStepsContainer';

// Validation schema
const contactInfoSchema = z.object({
  phone: z.string().min(8, 'Número de teléfono inválido'),
});

type ContactInfoForm = z.infer<typeof contactInfoSchema>;

export default function OwnerContactInfoScreen() {
  const { setOwnerData, ownerData } = useOnboardingStore();

  // Initialize form
  const methods = useForm<ContactInfoForm>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      phone: ownerData?.phone || '',
    },
    mode: 'onChange', // Enable real-time validation
  });

  const onSubmit = (data: ContactInfoForm) => {
    // Store data in global state
    setOwnerData({
      ...ownerData,
      phone: data.phone,
    });
    
    // Navigate to next step
    router.replace('/owner/step-3-security');
  };

  return (
    <OnboardingStepsContainer currentStep={2} totalSteps={4}>
      <VStack className="flex-1 gap-8">
        {/* Title */}
        <VStack className="gap-3">
          <Heading className="text-gray-900 text-3xl font-bold">
            Información de Contacto
          </Heading>
          <Text className="text-gray-600 text-lg">
            ¿Cómo podemos contactarte?
          </Text>
        </VStack>
        {/* Form */}
        <FormProvider {...methods}>
          <VStack className="gap-6">
            <FormInput
              name="phone"
              label="Teléfono"
              placeholder="+51 999 999 999"
              keyboardType="phone-pad"
              autoComplete="tel"
              autoFocus
              onSubmitEditing={methods.handleSubmit(onSubmit)}
            />
          </VStack>
        </FormProvider>
        {/* Continue button - Extra padding for keyboard */}
        <Box className="mt-auto pb-safe">
          <GluestackButton
            onPress={methods.handleSubmit(onSubmit)}
            disabled={!methods.formState.isValid}
            className={`w-full ${!methods.formState.isValid ? 'opacity-50' : ''}`}
          >
            <ButtonText>Continuar</ButtonText>
          </GluestackButton>
        </Box>
      </VStack>
    </OnboardingStepsContainer>
  );
}
