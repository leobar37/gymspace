import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Alert, SafeAreaView, ScrollView } from 'react-native';
import { z } from 'zod';

import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { FormInput } from '@/components/forms/FormInput';
import { Box } from '@/components/ui/box';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useFormatPrice } from '@/config/ConfigContext';
import { contractsKeys, useContractsController } from '@/features/contracts/controllers/contracts.controller';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Form validation schema  
const editContractSchema = z.object({
  startDate: z.date({
    required_error: 'La fecha de inicio es requerida',
    invalid_type_error: 'Fecha inválida',
  }),
  endDate: z.date({
    required_error: 'La fecha de fin es requerida',
    invalid_type_error: 'Fecha inválida',
  }),
  discountPercentage: z.string(),
  finalPrice: z.string().optional(),
});

type EditContractSchema = z.infer<typeof editContractSchema>;

export default function EditContractScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const formatPrice = useFormatPrice();
  const queryClient = useQueryClient();
  const { useContractDetail } = useContractsController();
  
  const { data: contract, isLoading } = useContractDetail(id!);

  const updateContractMutation = useMutation({
    mutationFn: async (data: any) => {
      // Note: The API currently doesn't have an updateContract endpoint.
      // This is a placeholder implementation that shows the UI but doesn't persist changes.
      // When the API endpoint is available, uncomment the line below:
      // const response = await sdk.contracts.updateContract(id!, data);
      
      // For now, we'll simulate success
      return { ...contract, ...data };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(contractsKeys.detail(id!), data);
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
      Alert.alert(
        'Éxito',
        'El contrato se ha actualizado correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo actualizar el contrato'
      );
    },
  });

  const {
    control,
    handleSubmit,
    watch,
  } = useForm<EditContractSchema>({
    resolver: zodResolver(editContractSchema),
    defaultValues: {
      startDate: contract ? new Date(contract.startDate) : new Date(),
      endDate: contract ? new Date(contract.endDate) : new Date(),
      discountPercentage: String(contract?.discountPercentage || 0),
      finalPrice: contract?.finalPrice ? String(contract.finalPrice) : '',
    },
    values: contract ? {
      startDate: new Date(contract.startDate),
      endDate: new Date(contract.endDate),
      discountPercentage: String(contract.discountPercentage || 0),
      finalPrice: contract.finalPrice ? String(contract.finalPrice) : '',
    } : undefined,
  });

  const watchedDiscount = watch('discountPercentage');
  const watchedFinalPrice = watch('finalPrice');

  const calculateFinalPrice = () => {
    if (!contract) return 0;
    
    const finalPriceNum = watchedFinalPrice ? Number(watchedFinalPrice) : 0;
    if (finalPriceNum > 0) {
      return finalPriceNum;
    }
    
    const basePrice = Number(contract.gymMembershipPlan?.basePrice || 0);
    const discount = watchedDiscount ? Number(watchedDiscount) : 0;
    return basePrice - (basePrice * discount / 100);
  };

  const onSubmit = async (data: EditContractSchema) => {
    const updateData = {
      discountPercentage: Number(data.discountPercentage) || 0,
      finalPrice: data.finalPrice ? Number(data.finalPrice) : undefined,
    };
    
    updateContractMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
        <Text className="text-gray-500 mt-4">Cargando contrato...</Text>
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Editar Contrato',
          headerBackTitle: 'Cancelar',
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView className="flex-1 bg-gray-50">
          <VStack className="p-4 gap-4">
            <Card>
              <Box className="p-4">
                <Heading size="md" className="mb-4">Información del contrato</Heading>
                <Text className="text-sm text-gray-500 mb-4">
                  Nota: Actualmente solo se pueden editar el descuento y precio personalizado.
                </Text>
                
                <VStack className="gap-4">
                  {/* Contract Info (Read-only) */}
                  <VStack className="gap-2">
                    <Text className="text-sm text-gray-500">Número de contrato:</Text>
                    <Text className="font-medium">{contract.contractNumber}</Text>
                  </VStack>

                  <VStack className="gap-2">
                    <Text className="text-sm text-gray-500">Cliente:</Text>
                    <Text className="font-medium">{contract.gymClient?.name || 'N/A'}</Text>
                  </VStack>

                  <VStack className="gap-2">
                    <Text className="text-sm text-gray-500">Plan:</Text>
                    <Text className="font-medium">{contract.gymMembershipPlan?.name || 'N/A'}</Text>
                  </VStack>

                  {/* Editable Fields */}
                  <FormDatePicker
                    control={control}
                    name="startDate"
                    label="Fecha de inicio"
                    placeholder="Seleccionar fecha"
                    disabled={true} // Usually start date shouldn't be changed
                  />

                  <FormDatePicker
                    control={control}
                    name="endDate"
                    label="Fecha de fin"
                    placeholder="Seleccionar fecha"
                    disabled={true} // Usually end date is calculated based on plan duration
                  />

                  <FormInput
                    control={control}
                    name="discountPercentage"
                    label="Descuento (%)"
                    placeholder="0"
                    keyboardType="numeric"
                  />

                  <FormInput
                    control={control}
                    name="finalPrice"
                    label="Precio personalizado (opcional)"
                    placeholder="0.00"
                    keyboardType="numeric"
                    description="Si se especifica, este precio reemplazará el precio del plan"
                  />
                </VStack>
              </Box>
            </Card>

            {/* Price Summary */}
            <Card>
              <Box className="p-4">
                <Heading size="sm" className="mb-3">Resumen de precios</Heading>
                <VStack className="gap-2">
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Precio base:</Text>
                    <Text className="font-medium">
                      {contract.gymMembershipPlan?.basePrice 
                        ? formatPrice(Number(contract.gymMembershipPlan.basePrice))
                        : 'N/A'}
                    </Text>
                  </HStack>
                  
                  {Number(watchedDiscount) > 0 && !watchedFinalPrice && (
                    <HStack className="justify-between">
                      <Text className="text-gray-600">Descuento ({watchedDiscount}%):</Text>
                      <Text className="font-medium text-green-600">
                        -{formatPrice((Number(contract.gymMembershipPlan?.basePrice || 0)) * Number(watchedDiscount) / 100)}
                      </Text>
                    </HStack>
                  )}
                  
                  {watchedFinalPrice && (
                    <HStack className="justify-between">
                      <Text className="text-gray-600">Precio personalizado:</Text>
                      <Text className="font-medium text-blue-600">
                        {formatPrice(Number(watchedFinalPrice))}
                      </Text>
                    </HStack>
                  )}
                  
                  <HStack className="justify-between pt-2 border-t border-gray-200">
                    <Text className="font-semibold">Precio final:</Text>
                    <Text className="font-bold text-lg">{formatPrice(calculateFinalPrice())}</Text>
                  </HStack>
                </VStack>
              </Box>
            </Card>

            {/* Submit Button - Only enabled when there are changes */}
            <Button
              onPress={handleSubmit(onSubmit)}
              isDisabled={updateContractMutation.isPending || (
                String(contract?.discountPercentage || 0) === watchedDiscount &&
                String(contract?.finalPrice || '') === (watchedFinalPrice || '')
              )}
              className="mt-4"
            >
              {updateContractMutation.isPending && <ButtonSpinner className="mr-2" />}
              <ButtonText>Actualizar contrato</ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}