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
              <Text className="text-gray-600">Paso 2 de 4</Text>
            </HStack>

            {/* Progress bar */}
            <Progress value={50} className="mb-8">
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
                    returnKeyType="done"
                    autoFocus
                    onSubmitEditing={methods.handleSubmit(onSubmit)}
                  />
                </VStack>
              </FormProvider>

              {/* Continue button */}
              <Box className="mt-auto pb-8">
                <GluestackButton
                  onPress={methods.handleSubmit(onSubmit)}
                  disabled={!methods.formState.isValid}
                  className={`${!methods.formState.isValid ? 'opacity-50' : ''}`}
                >
                  <ButtonText className="text-white font-semibold text-center">Continuar</ButtonText>
                </GluestackButton>
              </Box>
            </VStack>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
