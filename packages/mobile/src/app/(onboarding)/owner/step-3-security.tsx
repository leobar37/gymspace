import { router } from 'expo-router';
import React from 'react';
import { z } from 'zod';
import {
  FormInput,
  FormPassword,
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
    // Navigate to organization setup
    router.replace('/owner/organization-setup');
  };

  return (
    <OnboardingStepsContainer currentStep={3} totalSteps={4}>
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
            <FormPassword
              name="password"
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              returnKeyType="next"
              autoFocus
            />

            <FormPassword
              name="confirmPassword"
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
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