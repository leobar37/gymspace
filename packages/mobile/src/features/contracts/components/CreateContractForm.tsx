import { zodResolver } from '@hookform/resolvers/zod';
import { format, parse } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, View } from 'react-native';
import { z } from 'zod';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ClientSelector } from '@/features/clients/components/ClientSelector';
import { usePlansController } from '@/features/plans/controllers/plans.controller';
import { ContractFormData, useContractsController } from '../controllers/contracts.controller';
import { useFormatPrice } from '@/config/ConfigContext';

// Form validation schema
const createContractSchema = z.object({
  gymClientId: z.string().min(1, 'Debe seleccionar un cliente'),
  gymMembershipPlanId: z.string().min(1, 'Debe seleccionar un plan'),
  startDate: z.date({
    required_error: 'La fecha de inicio es requerida',
    invalid_type_error: 'Fecha inválida',
  }),
  discountPercentage: z.string(),
  customPrice: z.string().optional(),
});

type CreateContractSchema = z.infer<typeof createContractSchema>;

interface CreateContractFormProps {
  initialData?: Partial<ContractFormData>;
  onSuccess?: (contractId: string) => void;
  clientId?: string; // Pre-select client if provided
}

export const CreateContractForm: React.FC<CreateContractFormProps> = ({
  initialData,
  onSuccess,
  clientId,
}) => {
  const router = useRouter();
  const formatPrice = useFormatPrice();
  const { createContract, isCreatingContract } = useContractsController();
  const { usePlansList } = usePlansController();
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Load plans
  const { data: plansData } = usePlansList({ activeOnly: true });

  // Parse initial date if provided as string
  const parseInitialDate = (dateStr?: string) => {
    if (!dateStr) return new Date();
    try {
      return parse(dateStr, 'yyyy-MM-dd', new Date());
    } catch {
      return new Date();
    }
  };

  const {
    control,
    handleSubmit,
    watch,
  } = useForm<CreateContractSchema>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      gymClientId: clientId || initialData?.gymClientId || '',
      gymMembershipPlanId: initialData?.gymMembershipPlanId || '',
      startDate: parseInitialDate(initialData?.startDate),
      discountPercentage: String(initialData?.discountPercentage || 0),
      customPrice: initialData?.customPrice ? String(initialData.customPrice) : '',
    },
  });

  // Watch for plan changes to update pricing
  const watchedPlanId = watch('gymMembershipPlanId');
  const watchedDiscount = watch('discountPercentage');
  const watchedCustomPrice = watch('customPrice');

  useEffect(() => {
    if (watchedPlanId && plansData) {
      const plan = plansData.find(p => p.id === watchedPlanId);
      setSelectedPlan(plan);
    }
  }, [watchedPlanId, plansData]);

  const calculateFinalPrice = () => {
    if (!selectedPlan) return 0;
    
    const customPriceNum = watchedCustomPrice ? Number(watchedCustomPrice) : 0;
    if (customPriceNum > 0) {
      return customPriceNum;
    }
    
    const basePrice = selectedPlan.basePrice;
    const discount = watchedDiscount ? Number(watchedDiscount) : 0;
    return basePrice - (basePrice * discount / 100);
  };

  const onSubmit = async (data: CreateContractSchema) => {
    try {
      const contractData: ContractFormData = {
        gymClientId: data.gymClientId,
        gymMembershipPlanId: data.gymMembershipPlanId,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        discountPercentage: Number(data.discountPercentage) || 0,
        customPrice: data.customPrice ? Number(data.customPrice) : undefined,
      };
      
      createContract(contractData, {
        onSuccess: (newContract) => {
          Alert.alert(
            'Éxito',
            'El contrato se ha creado correctamente',
            [
              {
                text: 'OK',
                onPress: () => {
                  if (onSuccess) {
                    onSuccess(newContract.id);
                  } else {
                    router.replace(`/contracts/${newContract.id}`);
                  }
                },
              },
            ]
          );
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'No se pudo crear el contrato',
          );
        },
      });
    } catch (error) {
      console.error('Error creating contract:', error);
    }
  };


  return (
    <ScrollView className="flex-1 bg-gray-50">
      <VStack className="p-4 gap-4">
        <Card>
          <View className="p-4">
            <Heading size="md" className="mb-4">Información del contrato</Heading>
            
            {/* Client Selection */}
            <View className="mb-4">
              <ClientSelector
                control={control}
                name="gymClientId"
                label="Cliente"
                placeholder="Seleccionar cliente"
                description="Selecciona el cliente para este contrato"
                allowClear={true}
              />
            </View>

            {/* Plan Selection */}
            <View className="mb-4">
              <FormSelect
                control={control}
                name="gymMembershipPlanId"
                label="Plan de membresía"
                placeholder="Seleccionar plan"
                options={(plansData || []).map(plan => ({
                  label: `${plan.name} - ${formatPrice(plan.basePrice)}`,
                  value: plan.id,
                }))}
              />
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
                name="customPrice"
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
              <Heading size="sm" className="mb-3">Resumen de precios</Heading>
              <VStack className="gap-2">
                <HStack className="justify-between">
                  <Text className="text-gray-600">Precio base:</Text>
                  <Text className="font-medium">{formatPrice(selectedPlan.basePrice)}</Text>
                </HStack>
                
                {Number(watchedDiscount) > 0 && !watchedCustomPrice && (
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Descuento ({watchedDiscount}%):</Text>
                    <Text className="font-medium text-green-600">
                      -{formatPrice(selectedPlan.basePrice * Number(watchedDiscount) / 100)}
                    </Text>
                  </HStack>
                )}
                
                {watchedCustomPrice && (
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Precio personalizado:</Text>
                    <Text className="font-medium text-blue-600">
                      {formatPrice(Number(watchedCustomPrice))}
                    </Text>
                  </HStack>
                )}
                
                <HStack className="justify-between pt-2 border-t border-gray-200">
                  <Text className="font-semibold">Precio final:</Text>
                  <Text className="font-bold text-lg">{formatPrice(calculateFinalPrice())}</Text>
                </HStack>
              </VStack>
            </View>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          onPress={handleSubmit(onSubmit)}
          isDisabled={isCreatingContract}
          className="mt-4"
        >
          {isCreatingContract && <ButtonSpinner className="mr-2" />}
          <ButtonText>Crear contrato</ButtonText>
        </Button>
      </VStack>
    </ScrollView>
  );
};