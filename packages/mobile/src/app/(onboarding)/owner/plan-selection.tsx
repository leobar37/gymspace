import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CheckIcon, ChevronLeftIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, View } from 'react-native';
import {
  Badge,
  BadgeText,
  GluestackButton as Button,
  ButtonText,
  Card,
  Center,
  HStack,
  Heading,
  Icon,
  Progress,
  ProgressFilledTrack,
  Text,
  VStack
} from '../../../components/ui';
import { useOnboardingStore } from '@/store/onboarding';

// Mock subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Plan Básico',
    price: 99,
    currency: 'PEN',
    billingFrequency: 'monthly',
    features: [
      'Hasta 100 clientes',
      'Gestión de membresías',
      'Control de asistencia',
      'Reportes básicos',
      'Soporte por email'
    ],
    maxGyms: 1,
    maxClientsPerGym: 100,
    maxUsersPerGym: 3,
  },
  {
    id: 'premium',
    name: 'Plan Premium',
    price: 199,
    currency: 'PEN',
    billingFrequency: 'monthly',
    features: [
      'Clientes ilimitados',
      'Múltiples gimnasios',
      'Gestión de membresías',
      'Control de asistencia',
      'Evaluaciones físicas',
      'Reportes avanzados',
      'Integración con pagos',
      'App móvil personalizada',
      'Soporte prioritario 24/7'
    ],
    maxGyms: 5,
    maxClientsPerGym: 9999,
    maxUsersPerGym: 20,
    popular: true,
  }
];

export default function PlanSelectionScreen() {
  const { setSelectedPlanId, organizationData } = useOnboardingStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedPlan) {
      setSelectedPlanId(selectedPlan);
      router.push('/(onboarding)/owner/organization-setup');
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'PEN': return 'S/';
      case 'USD': return '$';
      default: return currency;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4">
          <HStack className="items-center justify-between mb-6">
            <Pressable onPress={() => router.back()}>
              <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
            </Pressable>
            <Text className="text-gray-600">Paso 3 de 7</Text>
          </HStack>

          {/* Progress bar */}
          <Progress value={42} className="mb-8">
            <ProgressFilledTrack />
          </Progress>

          {/* Title */}
          <VStack className="mb-6 gap-3">
            <Heading className="text-gray-900 text-3xl font-bold">
              Selecciona tu plan
            </Heading>
            <Text className="text-gray-600 text-lg">
              Elige el plan que mejor se adapte a tu gimnasio
            </Text>
          </VStack>
        </View>

        {/* Plans */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <VStack className="pb-6 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
              >
                <Card className={`p-5 ${selectedPlan === plan.id ? 'border-2 border-blue-500' : 'border-2 border-gray-200'}`}>
                  <VStack className="gap-4">
                    {/* Header with badge */}
                    <HStack className="items-start justify-between">
                      <VStack className="gap-1">
                        <HStack className="items-center gap-2">
                          <Text className="font-semibold text-xl text-gray-900">
                            {plan.name}
                          </Text>
                          {plan.popular && (
                            <Badge className="bg-blue-100">
                              <BadgeText className="text-blue-700">Popular</BadgeText>
                            </Badge>
                          )}
                        </HStack>
                        <HStack className="items-baseline gap-1">
                          <Text className="text-3xl font-bold text-gray-900">
                            {getCurrencySymbol(plan.currency)}{plan.price}
                          </Text>
                          <Text className="text-gray-600">/mes</Text>
                        </HStack>
                      </VStack>
                      {selectedPlan === plan.id && (
                        <Center className="w-6 h-6 bg-blue-500 rounded-full">
                          <Icon as={CheckIcon} className="text-white w-4 h-4" />
                        </Center>
                      )}
                    </HStack>

                    {/* Features */}
                    <VStack className="gap-2">
                      {plan.features.map((feature, index) => (
                        <HStack key={index} className="items-center gap-2">
                          <Icon as={CheckIcon} className="text-green-500 w-4 h-4" />
                          <Text className="text-gray-700 flex-1">{feature}</Text>
                        </HStack>
                      ))}
                    </VStack>

                    {/* Limits */}
                    <HStack className="pt-2 border-t border-gray-100 gap-4">
                      <VStack className="flex-1 gap-1">
                        <Text className="text-gray-500 text-sm">Gimnasios</Text>
                        <Text className="font-medium text-gray-900">
                          {plan.maxGyms === 1 ? '1 gimnasio' : `Hasta ${plan.maxGyms}`}
                        </Text>
                      </VStack>
                      <VStack className="flex-1 gap-1">
                        <Text className="text-gray-500 text-sm">Usuarios</Text>
                        <Text className="font-medium text-gray-900">
                          Hasta {plan.maxUsersPerGym}
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </Card>
              </Pressable>
            ))}
          </VStack>
        </ScrollView>

        {/* Continue button */}
        <View className="px-6 py-4 border-t border-gray-100">
          <Button
            onPress={handleContinue}
            disabled={!selectedPlan}
            className="py-3 px-6"
          >
            <ButtonText>Continuar</ButtonText>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}