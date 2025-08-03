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
import { useOnboardingStore } from '../../../store/onboarding';

// Validation schema
const contactInfoSchema = z.object({
  phone: z.string().min(8, 'Número de teléfono inválido'),
  whatsapp: z.string().min(8, 'Número de WhatsApp inválido').optional(),
});

type ContactInfoForm = z.infer<typeof contactInfoSchema>;

export default function OwnerContactInfoScreen() {
  const { setOwnerData, ownerData } = useOnboardingStore();

  // Initialize form
  const methods = useForm<ContactInfoForm>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      phone: ownerData?.phone || '',
      whatsapp: ownerData?.whatsapp || '',
    },
  });

  const onSubmit = (data: ContactInfoForm) => {
    // Store data in global state
    setOwnerData({
      ...ownerData,
      phone: data.phone,
      whatsapp: data.whatsapp,
    });
    
    // Navigate to next step
    router.push('/owner/step-3-security');
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
              <Text className="text-gray-600">Paso 2 de 3</Text>
            </HStack>

            {/* Progress bar */}
            <Progress value={66} className="mb-8">
              <ProgressFilledTrack />
            </Progress>

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
                    returnKeyType="next"
                    autoFocus
                  />

                  <FormInput
                    name="whatsapp"
                    label="WhatsApp (opcional)"
                    placeholder="+51 999 999 999"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    returnKeyType="done"
                    onSubmitEditing={methods.handleSubmit(onSubmit)}
                  />
                </VStack>
              </FormProvider>

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