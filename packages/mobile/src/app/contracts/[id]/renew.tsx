import React, { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, Alert, View } from 'react-native';
import { format, addMonths, addDays } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Box } from '@/components/ui/box';
import { Divider } from '@/components/ui/divider';
import { FormInput } from '@/components/forms/FormInput';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { useContractsController } from '@/features/contracts/controllers/contracts.controller';
import { useFormatPrice } from '@/config/ConfigContext';
import type { MembershipPlan } from '@gymspace/sdk';

// Form validation schema
const renewContractSchema = z.object({
  startDate: z.date({
    required_error: 'La fecha de inicio es requerida',
    invalid_type_error: 'Fecha inválida',
  }),
  discountPercentage: z.string().regex(/^\d*\.?\d*$/, 'Debe ser un número válido').optional().default('0'),
  finalPrice: z.string().regex(/^\d*\.?\d*$/, 'Debe ser un número válido').optional(),
});

type RenewContractFormData = z.infer<typeof renewContractSchema>;

export default function RenewContractScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const formatPrice = useFormatPrice();
  const { useContractDetail, renewContract, isRenewingContract } = useContractsController();
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  const { data: contract, isLoading } = useContractDetail(id!);
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isValid },
  } = useForm<RenewContractFormData>({
    resolver: zodResolver(renewContractSchema),
    mode: 'onChange',
    defaultValues: {
      startDate: new Date(),
      discountPercentage: '0',
      finalPrice: '',
    },
  });
  
  // Watch form values for price calculation
  const watchedDiscount = watch('discountPercentage');
  const watchedFinalPrice = watch('finalPrice');
  
  // Set default values when contract is loaded
  useEffect(() => {
    if (contract) {
      // Set start date to be the day after the current contract ends
      const newStartDate = addDays(new Date(contract.endDate), 1);
      setValue('startDate', newStartDate);
      
      // Use the same plan from the current contract
      if (contract.gymMembershipPlan) {
        setSelectedPlan(contract.gymMembershipPlan);
      }
      
      // Pre-fill discount if exists
      if (contract.discountPercentage) {
        setValue('discountPercentage', String(contract.discountPercentage));
      }
    }
  }, [contract, setValue]);
  
  const calculateFinalPrice = () => {
    if (!selectedPlan || !selectedPlan.basePrice) return 0;
    
    // If final price is specified and valid, use it
    const finalPriceNum = watchedFinalPrice ? Number(watchedFinalPrice) : 0;
    if (finalPriceNum > 0) {
      return finalPriceNum;
    }
    
    // Otherwise calculate based on plan price and discount
    const basePrice = Number(selectedPlan.basePrice) || 0;
    const discount = watchedDiscount ? Number(watchedDiscount) : 0;
    
    if (isNaN(basePrice) || isNaN(discount)) {
      return 0;
    }
    
    const finalPrice = basePrice - (basePrice * discount / 100);
    return finalPrice >= 0 ? finalPrice : 0;
  };
  
  const calculateEndDate = () => {
    if (!selectedPlan || !watch('startDate')) return null;
    
    const startDate = watch('startDate');
    let endDate = startDate;
    
    if (selectedPlan.durationMonths && selectedPlan.durationMonths > 0) {
      endDate = addMonths(startDate, selectedPlan.durationMonths);
    } else if (selectedPlan.durationDays && selectedPlan.durationDays > 0) {
      endDate = addDays(startDate, selectedPlan.durationDays);
    }
    
    return endDate;
  };
  
  const onSubmit = async (data: RenewContractFormData) => {
    if (!contract || !renewContract) {
      Alert.alert('Error', 'No se puede renovar el contrato en este momento');
      return;
    }
    
    try {
      renewContract(
        {
          id: id!,
          data: {
            startDate: format(data.startDate, 'yyyy-MM-dd'),
            discountPercentage: Number(data.discountPercentage) || 0,
            finalPrice: data.finalPrice ? Number(data.finalPrice) : undefined,
          }
        },
        {
        onSuccess: (newContract) => {
          Alert.alert(
            'Éxito',
            'El contrato se ha renovado correctamente',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.replace(`/contracts/${newContract.id}`);
                },
              },
            ]
          );
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'No se pudo renovar el contrato',
          );
        },
      });
    } catch (error) {
      console.error('Error renewing contract:', error);
      Alert.alert('Error', 'Ocurrió un error al renovar el contrato');
    }
  };
  
  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
        <Text className="text-gray-500 mt-4">Cargando información del contrato...</Text>
      </Box>
    );
  }
  
  if (!contract) {
    return (
      <Box className="flex-1 justify-center items-center p-4">
        <Text className="text-gray-500 text-center">No se encontró el contrato</Text>
        <Button onPress={() => router.back()} className="mt-4">
          <ButtonText>Volver</ButtonText>
        </Button>
      </Box>
    );
  }
  
  const endDate = calculateEndDate();
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Renovar Contrato',
          headerBackTitle: 'Atrás',
          headerLeft: () => (
            <Button
              variant="link"
              size="sm"
              onPress={() => router.back()}
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView className="flex-1 bg-gray-50">
          <VStack className="p-4 gap-4">
            {/* Current Contract Info */}
            <Card>
              <View className="p-4">
                <Heading size="sm" className="mb-3">Contrato actual</Heading>
                <VStack className="gap-2">
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Cliente:</Text>
                    <Text className="font-medium">{contract.gymClient?.name}</Text>
                  </HStack>
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Plan actual:</Text>
                    <Text className="font-medium">{contract.gymMembershipPlan?.name}</Text>
                  </HStack>
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Vence:</Text>
                    <Text className="font-medium">
                      {format(new Date(contract.endDate), 'dd/MM/yyyy')}
                    </Text>
                  </HStack>
                </VStack>
              </View>
            </Card>
            
            {/* Renewal Form */}
            <Card>
              <View className="p-4">
                <Heading size="md" className="mb-4">Nueva renovación</Heading>
                
                {/* Plan Info - Read Only */}
                <View className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <Text className="text-sm text-gray-600 mb-1">Plan a renovar:</Text>
                  <Text className="font-medium text-gray-900">
                    {selectedPlan?.name || contract.gymMembershipPlan?.name || 'Cargando...'}
                  </Text>
                  {selectedPlan && (
                    <Text className="text-sm text-gray-600 mt-1">
                      Precio base: {formatPrice(Number(selectedPlan.basePrice) || 0)}
                    </Text>
                  )}
                </View>
                
                {/* Start Date */}
                <View className="mb-4">
                  <FormDatePicker
                    control={control}
                    name="startDate"
                    label="Fecha de inicio"
                    placeholder="Seleccionar fecha de inicio"
                    minimumDate={new Date()}
                  />
                </View>
                
                {/* Discount */}
                <View className="mb-4">
                  <FormInput
                    control={control}
                    name="discountPercentage"
                    label="Descuento (%)"
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                
                {/* Custom Price */}
                <View className="mb-4">
                  <FormInput
                    control={control}
                    name="finalPrice"
                    label="Precio personalizado (opcional)"
                    placeholder="0.00"
                    keyboardType="numeric"
                    description="Si se especifica, este precio reemplazará el precio del plan"
                  />
                </View>
              </View>
            </Card>
            
            {/* Price Summary */}
            {selectedPlan && (
              <Card>
                <View className="p-4">
                  <Heading size="sm" className="mb-3">Resumen de la renovación</Heading>
                  <VStack className="gap-2">
                    <HStack className="justify-between">
                      <Text className="text-gray-600">Plan seleccionado:</Text>
                      <Text className="font-medium">{selectedPlan.name}</Text>
                    </HStack>
                    
                    <HStack className="justify-between">
                      <Text className="text-gray-600">Precio del plan:</Text>
                      <Text className="font-medium">{formatPrice(Number(selectedPlan.basePrice) || 0)}</Text>
                    </HStack>
                    
                    {Number(watchedDiscount) > 0 && !watchedFinalPrice && (
                      <HStack className="justify-between">
                        <Text className="text-gray-600">Descuento ({watchedDiscount}%):</Text>
                        <Text className="font-medium text-green-600">
                          -{formatPrice((Number(selectedPlan.basePrice) || 0) * Number(watchedDiscount) / 100)}
                        </Text>
                      </HStack>
                    )}
                    
                    {watchedFinalPrice && Number(watchedFinalPrice) > 0 && (
                      <HStack className="justify-between">
                        <Text className="text-gray-600">Precio personalizado:</Text>
                        <Text className="font-medium text-blue-600">
                          {formatPrice(Number(watchedFinalPrice))}
                        </Text>
                      </HStack>
                    )}
                    
                    <Divider className="my-2" />
                    
                    <HStack className="justify-between">
                      <Text className="font-semibold">Precio final:</Text>
                      <Text className="font-bold text-lg">{formatPrice(calculateFinalPrice())}</Text>
                    </HStack>
                    
                    {endDate && (
                      <>
                        <Divider className="my-2" />
                        <HStack className="justify-between">
                          <Text className="text-gray-600">Vigencia:</Text>
                          <Text className="font-medium">
                            {format(watch('startDate'), 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
                          </Text>
                        </HStack>
                      </>
                    )}
                  </VStack>
                </View>
              </Card>
            )}
            
            {/* Submit Button */}
            <Button
              onPress={handleSubmit(onSubmit)}
              isDisabled={!isValid || isRenewingContract}
              className="mt-4"
            >
              {isRenewingContract && <ButtonSpinner className="mr-2" />}
              <ButtonText>Renovar contrato</ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}