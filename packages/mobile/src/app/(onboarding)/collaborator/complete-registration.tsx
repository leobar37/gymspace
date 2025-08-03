import React from 'react';
import { SafeAreaView, View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { z } from 'zod';
import { 
  VStack, 
  HStack,
  Heading, 
  Text, 
  GluestackButton as Button, 
  ButtonText,
  Icon,
  Box,
  Card
} from '../../../components/ui';
import { 
  useForm, 
  FormProvider, 
  FormInput,
  zodResolver
} from '../../../components/forms';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon, UserIcon } from 'lucide-react-native';
import { useOnboardingStore } from '../../../store/onboarding';
import { useGymSdk } from '../../../providers/GymSdkProvider';
import { useMutation } from '@tanstack/react-query';

// Validation schema
const collaboratorSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'Número de teléfono inválido'),
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

type CollaboratorForm = z.infer<typeof collaboratorSchema>;

export default function CompleteRegistrationScreen() {
  const { invitationData, invitationToken, resetOnboarding } = useOnboardingStore();
  const { sdk, setAuthToken } = useGymSdk();

  // Initialize form
  const methods = useForm<CollaboratorForm>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: {
      name: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Complete registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: CollaboratorForm) => {
      // TODO: Implement actual API call to complete collaborator registration
      console.log('Completing collaborator registration:', {
        invitationToken,
        ...data,
      });
      
      // Mock successful registration
      return {
        success: true,
        accessToken: 'mock-token',
        userId: 'mock-user-id',
        gymId: 'mock-gym-id',
      };
    },
    onSuccess: async (data) => {
      // Store auth token
      await setAuthToken(data.accessToken);
      
      // Reset onboarding state
      resetOnboarding();
      
      // Navigate to collaborator dashboard
      router.replace(`/(app)/gym/${data.gymId}/dashboard`);
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
    },
  });

  const onSubmit = (data: CollaboratorForm) => {
    registerMutation.mutate(data);
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
            {/* Header */}
            <Pressable onPress={() => router.back()} className="mb-8">
              <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
            </Pressable>

            <VStack className="flex-1 gap-8">
              {/* Title */}
              <VStack className="gap-3">
                <Heading className="text-gray-900 text-3xl font-bold">
                  Completa tu registro
                </Heading>
                <Text className="text-gray-600 text-lg">
                  Ingresa tu información para unirte a {invitationData?.gymName}
                </Text>
              </VStack>

              {/* Email display */}
              <Card className="p-4 bg-gray-50 border border-gray-200">
                <HStack className="items-center gap-3">
                  <Icon as={UserIcon} className="text-gray-500 w-5 h-5" />
                  <VStack className="flex-1 gap-1">
                    <Text className="text-gray-500 text-sm">Correo electrónico</Text>
                    <Text className="font-medium text-gray-900">
                      {invitationData?.email}
                    </Text>
                  </VStack>
                </HStack>
              </Card>

              {/* Form */}
              <FormProvider {...methods}>
                <VStack className="gap-4">
                  <FormInput
                    name="name"
                    label="Nombre completo"
                    placeholder="Tu nombre"
                    autoComplete="name"
                  />

                  <FormInput
                    name="phone"
                    label="Teléfono"
                    placeholder="+51 999 999 999"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />

                  <FormInput
                    name="password"
                    label="Contraseña"
                    placeholder="Mínimo 8 caracteres"
                    secureTextEntry
                    autoComplete="new-password"
                  />

                  <FormInput
                    name="confirmPassword"
                    label="Confirmar contraseña"
                    placeholder="Repite tu contraseña"
                    secureTextEntry
                    autoComplete="new-password"
                  />
                </VStack>
              </FormProvider>

              {/* Submit button */}
              <Box className="mt-auto pb-4">
                <Button
                  onPress={methods.handleSubmit(onSubmit)}
                  disabled={registerMutation.isPending}
                  className="py-3 px-6"
                  className="w-full"
                >
                  <ButtonText>
                    {registerMutation.isPending ? 'Registrando...' : 'Completar registro'}
                  </ButtonText>
                </Button>
              </Box>
            </VStack>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}