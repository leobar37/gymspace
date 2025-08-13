import { zodResolver } from '@hookform/resolvers/zod';
import { format, parse } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';
import { useLoadingScreen } from '@/shared/loading-screen';
import { FormInput } from '@/components/forms/FormInput';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ClientSelector } from '@/features/clients/components/ClientSelector';
import { PlanListSelector } from '@/features/plans/components/PlanListSelector';
import { AssetSelector } from '@/features/assets/components/AssetSelector';
import { ContractFormData, useContractsController } from '../controllers/contracts.controller';
import { useFormatPrice } from '@/config/ConfigContext';

// Form validation schema
const createContractSchema = z.object({
  gymClientId: z.string().min(1, 'El cliente es requerido'),
  gymMembershipPlanId: z.string().min(1, 'El plan es requerido'),
  startDate: z.date({
    required_error: 'La fecha de inicio es requerida',
    invalid_type_error: 'Fecha inválida',
  }),
  discountPercentage: z.string().regex(/^\d*\.?\d*$/, 'Debe ser un número válido').optional().default('0'),
  finalPrice: z.string().regex(/^\d*\.?\d*$/, 'Debe ser un número válido').optional(),
  attachmentIds: z.array(z.string()).optional().default([]),
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
  const { createContract } = useContractsController();
  const { execute } = useLoadingScreen();

  const [selectedPlan, setSelectedPlan] = useState<any>(null);


  // Parse initial date if provided as string
  const parseInitialDate = (dateStr?: string) => {
    if (!dateStr) return new Date();
    try {
      return parse(dateStr, 'yyyy-MM-dd', new Date());
    } catch {
      return new Date();
    }
  };

  const methods = useForm<CreateContractSchema>({
    resolver: zodResolver(createContractSchema),
    mode: 'onChange', // Enable validation on change
    defaultValues: {
      gymClientId: clientId || initialData?.gymClientId || '',
      gymMembershipPlanId: initialData?.gymMembershipPlanId || '',
      startDate: parseInitialDate(initialData?.startDate),
      discountPercentage: String(initialData?.discountPercentage || 0),
      finalPrice: initialData?.finalPrice ? String(initialData.finalPrice) : '',
      attachmentIds: [],
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid },
  } = methods;

  // Watch for plan changes to update pricing
  const watchedDiscount = watch('discountPercentage');
  const watchedFinalPrice = watch('finalPrice');

  const calculateFinalPrice = () => {
    if (!selectedPlan) return 0;

    // If final price is specified and valid, use it
    const finalPriceNum = watchedFinalPrice ? Number(watchedFinalPrice) : 0;
    if (finalPriceNum > 0) {
      return finalPriceNum;
    }

    // Otherwise calculate based on plan price and discount
    const basePrice = selectedPlan.basePrice || 0;
    const discount = watchedDiscount ? Number(watchedDiscount) : 0;
    const finalPrice = basePrice - (basePrice * discount / 100);
    return finalPrice >= 0 ? finalPrice : 0;
  };

  const onSubmit = async (data: CreateContractSchema) => {
    const contractData: ContractFormData = {
      gymClientId: data.gymClientId,
      gymMembershipPlanId: data.gymMembershipPlanId,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      discountPercentage: Number(data.discountPercentage) || 0,
      customPrice: data.finalPrice ? Number(data.finalPrice) : undefined,
      attachmentIds: data.attachmentIds || [],
    };

    await execute<{ id: string }>(
      new Promise((resolve, reject) => {
        return createContract(contractData, {
          onSuccess: resolve,
          onError: reject,
        });
      }),
      {
        action: 'Creando contrato...',
        successMessage: 'El contrato se ha creado correctamente',
        errorFormatter: (error: any) => {
          console.log("err", error);

          // Check for message in details first (new error format)
          if (error?.details?.message) {
            return error.details.message;
          }
          
          // Fallback to old error format
          if (error?.response?.data?.message) {
            return error.response.data.message;
          }
          
          // Check for direct message property
          if (error?.message) {
            if (typeof error.message === 'string') {
              return error.message;
            }
            // If message is an array (validation errors)
            if (Array.isArray(error.message)) {
              return error.message.join(', ');
            }
          }
          
          return 'No se pudo crear el contrato. Por favor, intenta de nuevo.';
        },
        successActions: [],
        hideOnSuccess: false,
        onSuccess: (newContract) => {
          if (onSuccess) {
            onSuccess(newContract.id);
          } else {
            router.replace(`../contracts/${newContract.id}`);
          }
        },
      }
    );
  };


  return (
    <FormProvider {...methods}>
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
                  label="Cliente *"
                  placeholder="Seleccionar cliente"
                  description="Selecciona el cliente para este contrato"
                  allowClear={false}
                />
              </View>

              {/* Plan Selection */}
              <View className="mb-4">
                <PlanListSelector
                  control={control}
                  name="gymMembershipPlanId"
                  label="Plan de membresía *"
                  placeholder="Seleccionar plan"
                  description="Selecciona el plan de membresía para este contrato"
                  allowClear={false}
                  activeOnly={true}
                  onPlanSelect={(plan) => setSelectedPlan(plan)}
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
                  name="finalPrice"
                  label="Precio personalizado (opcional)"
                  placeholder="0.00"
                  keyboardType="numeric"
                  description="Si se especifica, este precio reemplazará el precio del plan"
                />
              </View>

              {/* Attachments */}
              <View className="mb-4">
                <AssetSelector
                  name="attachmentIds"
                  multi={true}
                  label="Documentos adjuntos (opcional)"
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
                    <Text className="text-gray-600">Precio del plan:</Text>
                    <Text className="font-medium">{formatPrice(selectedPlan.basePrice || 0)}</Text>
                  </HStack>

                  {Number(watchedDiscount) > 0 && !watchedFinalPrice && (
                    <HStack className="justify-between">
                      <Text className="text-gray-600">Descuento ({watchedDiscount}%):</Text>
                      <Text className="font-medium text-green-600">
                        -{formatPrice((selectedPlan.basePrice || 0) * Number(watchedDiscount) / 100)}
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
            isDisabled={!isValid}
            className="mt-4"
          >
            <ButtonText>Crear contrato</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </FormProvider>
  );
};