import React, { useState, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText, FormControlError, FormControlErrorIcon, FormControlErrorText } from '@/components/ui/form-control';
import { Select, SelectTrigger, SelectInput, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem } from '@/components/ui/select';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { AlertCircleIcon, ChevronDownIcon } from 'lucide-react-native';
import { FormInput } from '@/components/forms/FormInput';
// Date picker not available, using text input
import { useContractsController, ContractFormData } from '../controllers/contracts.controller';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import { usePlansController } from '@/features/plans/controllers/plans.controller';

// Form validation schema
const createContractSchema = z.object({
  gymClientId: z.string().min(1, 'Debe seleccionar un cliente'),
  gymMembershipPlanId: z.string().min(1, 'Debe seleccionar un plan'),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  discountPercentage: z.preprocess(
    (val) => val === '' || val === undefined ? 0 : Number(val),
    z.number().min(0).max(100)
  ),
  customPrice: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : Number(val),
    z.number().min(0).optional()
  ),
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
  const { createContract, isCreatingContract, createContractError } = useContractsController();
  const { useClientsList } = useClientsController();
  const { usePlansList } = usePlansController();
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Load clients and plans
  const { data: clientsData } = useClientsList({ activeOnly: true });
  const { data: plansData } = usePlansList({ activeOnly: true });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateContractSchema>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      gymClientId: clientId || initialData?.gymClientId || '',
      gymMembershipPlanId: initialData?.gymMembershipPlanId || '',
      startDate: initialData?.startDate || format(new Date(), 'yyyy-MM-dd'),
      discountPercentage: initialData?.discountPercentage || 0,
      customPrice: initialData?.customPrice,
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
    
    if (watchedCustomPrice && watchedCustomPrice > 0) {
      return watchedCustomPrice;
    }
    
    const basePrice = selectedPlan.basePrice;
    const discount = watchedDiscount || 0;
    return basePrice - (basePrice * discount / 100);
  };

  const onSubmit = async (data: CreateContractSchema) => {
    try {
      const contractData: ContractFormData = {
        ...data,
        discountPercentage: data.discountPercentage || 0,
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <VStack className="p-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <Heading size="md" className="mb-4">Información del contrato</Heading>
            
            {/* Client Selection */}
            <FormControl
              isInvalid={!!errors.gymClientId}
              className="mb-4"
            >
              <FormControlLabel>
                <FormControlLabelText>Cliente</FormControlLabelText>
              </FormControlLabel>
              <Controller
                control={control}
                name="gymClientId"
                render={({ field: { onChange, value } }) => (
                  <Select
                    selectedValue={value}
                    onValueChange={onChange}
                  >
                    <SelectTrigger>
                      <SelectInput 
                        placeholder="Seleccionar cliente"
                        value={clientsData?.data?.find(c => c.id === value)?.name || ''}
                      />
                      <Icon as={ChevronDownIcon} className="mr-3" />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        {(clientsData?.data || []).map((client) => (
                          <SelectItem
                            key={client.id}
                            label={client.name}
                            value={client.id}
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                )}
              />
              {errors.gymClientId && (
                <FormControlError>
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText>{errors.gymClientId.message}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Plan Selection */}
            <FormControl
              isInvalid={!!errors.gymMembershipPlanId}
              className="mb-4"
            >
              <FormControlLabel>
                <FormControlLabelText>Plan de membresía</FormControlLabelText>
              </FormControlLabel>
              <Controller
                control={control}
                name="gymMembershipPlanId"
                render={({ field: { onChange, value } }) => (
                  <Select
                    selectedValue={value}
                    onValueChange={onChange}
                  >
                    <SelectTrigger>
                      <SelectInput 
                        placeholder="Seleccionar plan"
                        value={plansData?.find(p => p.id === value)?.name || ''}
                      />
                      <Icon as={ChevronDownIcon} className="mr-3" />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        {(plansData || []).map((plan) => (
                          <SelectItem
                            key={plan.id}
                            label={`${plan.name} - ${formatPrice(plan.basePrice)}`}
                            value={plan.id}
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                )}
              />
              {errors.gymMembershipPlanId && (
                <FormControlError>
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText>{errors.gymMembershipPlanId.message}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Start Date */}
            <FormControl
              isInvalid={!!errors.startDate}
              className="mb-4"
            >
              <FormControlLabel>
                <FormControlLabelText>Fecha de inicio</FormControlLabelText>
              </FormControlLabel>
              <FormInput
                control={control}
                name="startDate"
                label=""
                placeholder="YYYY-MM-DD"
                description="Formato: YYYY-MM-DD (ej: 2024-01-15)"
              />
              {errors.startDate && (
                <FormControlError>
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText>{errors.startDate.message}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Discount */}
            <FormInput
              control={control}
              name="discountPercentage"
              label="Descuento (%)"
              placeholder="0"
              keyboardType="numeric"
            />

            {/* Custom Price */}
            <FormInput
              control={control}
              name="customPrice"
              label="Precio personalizado (opcional)"
              placeholder="0.00"
              keyboardType="numeric"
              description="Si se especifica, este precio reemplazará el precio del plan"
            />
          </CardContent>
        </Card>

        {/* Price Summary */}
        {selectedPlan && (
          <Card>
            <CardContent className="p-4">
              <Heading size="sm" className="mb-3">Resumen de precios</Heading>
              <VStack className="gap-2">
                <HStack className="justify-between">
                  <Text className="text-gray-600">Precio base:</Text>
                  <Text className="font-medium">{formatPrice(selectedPlan.basePrice)}</Text>
                </HStack>
                
                {watchedDiscount > 0 && !watchedCustomPrice && (
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Descuento ({watchedDiscount}%):</Text>
                    <Text className="font-medium text-green-600">
                      -{formatPrice(selectedPlan.basePrice * watchedDiscount / 100)}
                    </Text>
                  </HStack>
                )}
                
                {watchedCustomPrice && (
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Precio personalizado:</Text>
                    <Text className="font-medium text-blue-600">
                      {formatPrice(watchedCustomPrice)}
                    </Text>
                  </HStack>
                )}
                
                <HStack className="justify-between pt-2 border-t border-gray-200">
                  <Text className="font-semibold">Precio final:</Text>
                  <Text className="font-bold text-lg">{formatPrice(calculateFinalPrice())}</Text>
                </HStack>
              </VStack>
            </CardContent>
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