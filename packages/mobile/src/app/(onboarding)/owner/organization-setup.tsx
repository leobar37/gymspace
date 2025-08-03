import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon, DollarSignIcon, FlagIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, View } from 'react-native';
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
  Card,
  HStack,
  Heading,
  Icon,
  Progress,
  Text,
  VStack
} from '../../../components/ui';
import { useOnboardingStore } from '@/store/onboarding';

// Country/currency options
const COUNTRY_OPTIONS = [
  {
    value: 'PE',
    label: 'Perú',
    currency: 'PEN',
    currencySymbol: 'S/',
    flag: '🇵🇪'
  },
  {
    value: 'EC',
    label: 'Ecuador',
    currency: 'USD',
    currencySymbol: '$',
    flag: '🇪🇨'
  },
];

// Validation schema
const organizationSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  country: z.string().min(2, 'Selecciona un país'),
});

type OrganizationForm = z.infer<typeof organizationSchema>;

export default function OrganizationSetupScreen() {
  const { setOrganizationData } = useOnboardingStore();
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  // Initialize form
  const methods = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      country: '',
    },
  });

  const onSubmit = (data: OrganizationForm) => {
    const country = COUNTRY_OPTIONS.find(c => c.value === data.country);
    if (country) {
      setOrganizationData({
        name: data.name,
        country: country.value,
        currency: country.currency,
      });
      router.push('/(onboarding)/owner/create-gym');
    }
  };

  const selectedCountryInfo = COUNTRY_OPTIONS.find(c => c.value === selectedCountry);

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
            <Text className="text-gray-600">Paso 4 de 7</Text>
          </HStack>

          {/* Progress bar */}
          <Box className="mb-8">
            <Progress value={56} className="h-2 bg-gray-200 rounded-full" />
          </Box>

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
              <Button
                onPress={methods.handleSubmit(onSubmit)}
                className="w-full"
              >
                <ButtonText>Continuar</ButtonText>
              </Button>
            </Box>
          </VStack>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}