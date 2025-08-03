import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { z } from 'zod';
import {
  FormInput,
  FormTextarea,
  FormProvider,
  useForm,
  zodResolver,
} from '../../../components/forms';
import {
  VStack,
  Heading,
  Text,
  Button,
  ButtonText,
  ButtonSpinner,
} from '../../../components/ui';
import { useAtom } from 'jotai';
import { ownerOnboardingDataAtom, updateOwnerDataAtom } from '../stores/onboarding.store';
import { useOnboardingController } from '../controllers/onboarding.controller';

// Validation schema
const gymSchema = z.object({
  gymName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  gymAddress: z.string().min(5, 'La dirección es requerida'),
  gymPhone: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  gymDescription: z.string().optional(),
});

type GymFormData = z.infer<typeof gymSchema>;

interface CreateGymFormProps {
  onComplete?: () => void;
}

export const CreateGymForm: React.FC<CreateGymFormProps> = ({ onComplete }) => {
  const [ownerData] = useAtom(ownerOnboardingDataAtom);
  const [, updateOwnerData] = useAtom(updateOwnerDataAtom);
  const { completeOnboarding, isOnboarding } = useOnboardingController();

  const methods = useForm<GymFormData>({
    resolver: zodResolver(gymSchema),
    defaultValues: {
      gymName: ownerData.gymName || '',
      gymAddress: ownerData.gymAddress || '',
      gymPhone: ownerData.gymPhone || '',
      gymDescription: ownerData.gymDescription || '',
    },
  });

  const onSubmit = async (data: GymFormData) => {
    // Update store
    updateOwnerData(data);

    // Complete onboarding
    try {
      await completeOnboarding(
        {
          name: ownerData.name!,
          email: ownerData.email!,
          phone: ownerData.phone!,
          password: ownerData.password!,
        },
        {
          name: ownerData.organizationName!,
          subscriptionPlanId: ownerData.subscriptionPlanId!,
          country: ownerData.country!,
          currency: ownerData.currency!,
          timezone: ownerData.timezone!,
        },
        {
          name: data.gymName,
          address: data.gymAddress,
          phone: data.gymPhone,
          description: data.gymDescription,
        }
      );

      onComplete?.();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  return (
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
          <VStack className="gap-8">
            {/* Header */}
            <VStack className="gap-3">
              <Heading className="text-gray-900 text-3xl font-bold">
                Crea tu primer gimnasio
              </Heading>
              <Text className="text-gray-600 text-lg">
                Configura la información básica de tu gimnasio
              </Text>
            </VStack>

            {/* Form */}
            <FormProvider {...methods}>
              <VStack className="gap-6">
                <FormInput
                  name="gymName"
                  label="Nombre del gimnasio"
                  placeholder="Fitness Center Pro"
                  autoFocus
                  returnKeyType="next"
                />

                <FormInput
                  name="gymAddress"
                  label="Dirección"
                  placeholder="Av. Principal 123, Ciudad"
                  returnKeyType="next"
                />

                <FormInput
                  name="gymPhone"
                  label="Teléfono del gimnasio"
                  placeholder="+1 234 567 8900"
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />

                <FormTextarea
                  name="gymDescription"
                  label="Descripción (opcional)"
                  placeholder="Describe tu gimnasio y los servicios que ofreces..."
                  numberOfLines={4}
                  maxLength={500}
                />
              </VStack>
            </FormProvider>

            {/* Submit button */}
            <Button
              onPress={methods.handleSubmit(onSubmit)}
              disabled={isOnboarding}
              className="w-full py-3 px-6 bg-blue-600 rounded-lg"
            >
              {isOnboarding ? (
                <>
                  <ButtonSpinner className="text-white" />
                  <ButtonText className="text-white font-semibold ml-2">
                    Creando gimnasio...
                  </ButtonText>
                </>
              ) : (
                <ButtonText className="text-white font-semibold text-center">
                  Completar configuración
                </ButtonText>
              )}
            </Button>
          </VStack>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};