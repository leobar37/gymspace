import {
  FormInput,
  FormProvider,
  FormSelect,
  useForm,
  zodResolver
} from '@/components/forms';
import { Box } from '@/components/ui/box';
import { ButtonSpinner, ButtonText, Button as GluestackButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useOnboardingStore } from '@/store/onboarding';
import { StartOnboardingData } from '@gymspace/sdk';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon, DollarSignIcon, FlagIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, View } from 'react-native';
import { z } from 'zod';

// Country/currency options
const COUNTRY_OPTIONS = [
  {
    value: 'PE',
    label: 'Perú',
    currency: 'PEN',
    currencySymbol: 'S/',
    flag: '🇵🇪',
    timezones: ['America/Lima']
  },
  {
    value: 'EC',
    label: 'Ecuador',
    currency: 'USD',
    currencySymbol: '$',
    flag: '🇪🇨',
    timezones: ['America/Guayaquil', 'Pacific/Galapagos']
  },
];

// Timezone options based on selected country
const getTimezoneOptions = (country: string) => {
  const countryData = COUNTRY_OPTIONS.find(c => c.value === country);
  if (!countryData) return [];

  return countryData.timezones.map(tz => ({
    label: tz.replace('America/', '').replace('Pacific/', '').replace(/_/g, ' '),
    value: tz
  }));
};

// Validation schema
const organizationSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  country: z.string().min(2, 'Selecciona un país'),
  timezone: z.string().min(1, 'Selecciona una zona horaria'),
});

type OrganizationForm = z.infer<typeof organizationSchema>;

export default function OrganizationSetupScreen() {
  const { setOrganizationData, ownerData, setTempAuthTokens } = useOnboardingStore();
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  // Initialize form
  const methods = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      country: '',
      timezone: '',
    },
  });

  const context = useGymSdk();
  const startOnboarding = useMutation({
    mutationFn: (input: StartOnboardingData) => {
      return context.sdk.onboarding.start({
        ...input
      })
    },
    onSuccess: async (response) => {
      // Store tokens temporarily - they'll be applied after email verification
      setTempAuthTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
      
      // Store the gym ID that was created during onboarding
      if (response.gym?.id) {
        await context.setCurrentGymId(response.gym.id);
      }
      
      console.log("Registration completed, awaiting email verification");
    }
  })

  const onSubmit = async (data: OrganizationForm) => {
    const country = COUNTRY_OPTIONS.find(c => c.value === data.country);

    if (country) {
      setOrganizationData({
        name: data.name,
        country: country.value,
        currency: country.currency,
        timezone: data.timezone,
      });
      try {
        const result = await startOnboarding.mutateAsync({
          country: country.value,
          currency: country.currency,
          email: ownerData.email,
          name: ownerData.name,
          organizationName: data.name,
          password: ownerData.password,
          phone: ownerData.phone,
          timezone: data.timezone
        })
        console.log("result", result);
        router.replace('/owner/email-verification');
      } catch (error) {
        console.log("error", error);
      }
    }
  };

  const selectedCountryInfo = COUNTRY_OPTIONS.find(c => c.value === selectedCountry);

  // Reset timezone when country changes
  useEffect(() => {
    if (selectedCountry) {
      const timezones = getTimezoneOptions(selectedCountry);
      if (timezones.length > 0) {
        methods.setValue('timezone', timezones[0].value);
      }
    }
  }, [selectedCountry, methods]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 py-4">
          {/* Header */}
          <HStack className="items-center justify-between mb-6">
            <Pressable onPress={() => router.back()}>
              <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
            </Pressable>
            <Text className="text-gray-600">Paso 4 de 4</Text>
          </HStack>

          {/* Progress bar */}
          <Progress value={100} className="mb-8">
            <ProgressFilledTrack />
          </Progress>

          <VStack className="flex-1 gap-12">
            {/* Title */}
            <VStack className="gap-3">
              <Heading className="text-gray-900 text-2xl font-bold">
                Configuración de Organización
              </Heading>
              <Text className="text-gray-600 text-lg">
                Configura los detalles de tu organización
              </Text>
            </VStack>

            {/* Form */}
            <FormProvider {...methods}>
              <VStack className="gap-8">
                <FormInput
                  name="name"
                  label="Nombre de la organización"
                  placeholder="Mi Cadena de Gimnasios"
                  autoComplete="organization"
                />

                {/* Country selection */}
                <VStack className="gap-3">
                  <Text className="font-medium text-gray-900">
                    País y moneda
                  </Text>
                  <VStack className="gap-3">
                    {COUNTRY_OPTIONS.map((country) => (
                      <Pressable
                        key={country.value}
                        onPress={() => {
                          methods.setValue('country', country.value);
                          setSelectedCountry(country.value);
                        }}
                      >
                        <Card className={`p-4 ${selectedCountry === country.value ? 'border-2 border-blue-500' : 'border-2 border-gray-200'}`}>
                          <HStack className="items-center justify-between">
                            <HStack className="items-center gap-3">
                              <Text className="text-2xl">{country.flag}</Text>
                              <VStack className="gap-1">
                                <Text className="font-medium text-gray-900">
                                  {country.label}
                                </Text>
                                <HStack className="items-center gap-1">
                                  <Icon as={DollarSignIcon} className="text-gray-500 w-3 h-3" />
                                  <Text className="text-gray-600 text-sm">
                                    {country.currency} ({country.currencySymbol})
                                  </Text>
                                </HStack>
                              </VStack>
                            </HStack>
                            <Box
                              className={`w-5 h-5 rounded-full border-2 ${selectedCountry === country.value
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                                }`}
                            >
                              {selectedCountry === country.value && (
                                <Box className="w-2 h-2 bg-white rounded-full m-auto" />
                              )}
                            </Box>
                          </HStack>
                        </Card>
                      </Pressable>
                    ))}
                  </VStack>
                </VStack>

                {/* Timezone selection */}
                {selectedCountry && (
                  <FormSelect
                    name="timezone"
                    label="Zona horaria"
                    placeholder="Selecciona una zona horaria"
                    options={getTimezoneOptions(selectedCountry)}
                  />
                )}

                {/* Currency preview */}
                {selectedCountryInfo && (
                  <Card className="p-4 bg-blue-50 border border-blue-200">
                    <HStack className="items-center gap-2">
                      <Icon as={FlagIcon} className="text-blue-600 w-4 h-4" />
                      <Text className="text-blue-700">
                        Los precios se mostrarán en {selectedCountryInfo.currency} ({selectedCountryInfo.currencySymbol})
                      </Text>
                    </HStack>
                  </Card>
                )}
              </VStack>
            </FormProvider>

            {/* Continue button */}
            <Box className="mt-auto pb-4">
              <GluestackButton
                onPress={methods.handleSubmit(onSubmit)}
                className={`w-full ${(!methods.formState.isValid || !selectedCountry || startOnboarding.isPending) ? 'opacity-50' : ''}`}
                disabled={!methods.formState.isValid || !selectedCountry || startOnboarding.isPending}
              >
                {startOnboarding.isPending && <ButtonSpinner className="mr-2" />}
                <ButtonText>Continuar</ButtonText>
              </GluestackButton>
            </Box>
          </VStack>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}