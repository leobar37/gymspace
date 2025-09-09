import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { FormInput } from '@/components/forms/FormInput';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useFormatPrice } from '@/config/ConfigContext';
import { ClientSelector } from '@/features/clients/components/ClientSelector';
import { FileSelector } from '@/features/files/components/FileSelector';
import { PaymentMethodSelectorField } from '@/features/payment-methods/components/PaymentMethodSelectorField';
import { PlanSelector } from '@/features/plans/components/PlanSelector';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { useLoadingScreen } from '@/shared/loading-screen';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parse } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';
import { ContractFormData, useContractsController } from '../controllers/contracts.controller';

// Form validation schema
const createContractSchema = z.object({
  gymClientId: z.string().min(1, 'El cliente es requerido'),
  gymMembershipPlanId: z.string().min(1, 'El plan es requerido'),
  paymentMethodId: z.string().min(1, 'El método de pago es requerido'),
  startDate: z.date({
    required_error: 'La fecha de inicio es requerida',
    invalid_type_error: 'Fecha inválida',
  }),
  discountPercentage: z
    .string()
    .regex(/^\d*\.?\d*$/, 'Debe ser un número válido')
    .optional()
    .default('0'),
  customPrice: z
    .string()
    .regex(/^\d*\.?\d*$/, 'Debe ser un número válido')
    .optional(),
  receiptIds: z.array(z.string()).optional().default([]),
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
      paymentMethodId: initialData?.paymentMethodId || '',
      startDate: parseInitialDate(initialData?.startDate),
      discountPercentage: String(initialData?.discountPercentage || 0),
      customPrice: initialData?.customPrice ? String(initialData.customPrice) : '',
      receiptIds: [],
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid },
  } = methods;

  const watchedDiscount = watch('discountPercentage');
  const watchedCustomPrice = watch('customPrice');

  const calculateFinalPrice = () => {
    if (!selectedPlan) return 0;

    // If custom price is specified and valid, use it
    const customPriceNum = watchedCustomPrice ? Number(watchedCustomPrice) : 0;
    if (customPriceNum > 0) {
      return customPriceNum;
    }

    // Otherwise calculate based on plan price and discount
    const basePrice = selectedPlan.basePrice || 0;
    const discount = watchedDiscount ? Number(watchedDiscount) : 0;
    const finalPrice = basePrice - (basePrice * discount) / 100;
    return finalPrice >= 0 ? finalPrice : 0;
  };

  const onSubmit = async (data: CreateContractSchema) => {
    const contractData: ContractFormData = {
      gymClientId: data.gymClientId,
      gymMembershipPlanId: data.gymMembershipPlanId,
      paymentMethodId: data.paymentMethodId,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      discountPercentage: Number(data.discountPercentage) || 0,
      customPrice: data.customPrice ? Number(data.customPrice) : undefined,
      receiptIds: data.receiptIds || [],
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
          console.log('err', error);

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
      },
    );
  };

  return (
    <FormProvider {...methods}>
      <ScreenForm
        title="Nuevo contrato"
        showBackButton={true}
        showFixedFooter
        footerContent={
          <View>
            {/* Price Summary */}
            {selectedPlan && (
              <Card className="mx-4 mt-3 mb-2">
                <View className="p-3">
                  <Heading size="sm" className="mb-2">
                    Resumen de precios
                  </Heading>
                  <VStack className="gap-2">
                    <HStack className="justify-between">
                      <Text className="text-gray-600">Precio del plan:</Text>
                      <Text className="font-medium">
                        {formatPrice(selectedPlan.basePrice || 0)}
                      </Text>
                    </HStack>

                    {Number(watchedDiscount) > 0 && !watchedCustomPrice && (
                      <HStack className="justify-between">
                        <Text className="text-gray-600">Descuento ({watchedDiscount}%):</Text>
                        <Text className="font-medium text-green-600">
                          -
                          {formatPrice(
                            ((selectedPlan.basePrice || 0) * Number(watchedDiscount)) / 100,
                          )}
                        </Text>
                      </HStack>
                    )}

                    {watchedCustomPrice && Number(watchedCustomPrice) > 0 && (
                      <HStack className="justify-between">
                        <Text className="text-gray-600">Precio personalizado:</Text>
                        <Text className="font-medium text-blue-600">
                          {formatPrice(Number(watchedCustomPrice))}
                        </Text>
                      </HStack>
                    )}

                    <HStack className="justify-between pt-2 border-t border-gray-200">
                      <Text className="font-semibold">Precio final:</Text>
                      <Text className="font-bold text-lg">
                        {formatPrice(calculateFinalPrice())}
                      </Text>
                    </HStack>
                  </VStack>
                </View>
              </Card>
            )}

            {/* Submit Button */}
            <View className="px-4 pb-3">
              <Button onPress={handleSubmit(onSubmit)} isDisabled={!isValid} variant="solid">
                <ButtonText>Crear contrato</ButtonText>
              </Button>
            </View>
          </View>
        }
      >
        <View className="py-1 px-3 pb-40 bg-white">
          <Heading size="md" className="mb-3">
            Información del contrato
          </Heading>
          {/* Client Selection */}
          <View className="mb-3">
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
          <View className="mb-3">
            <PlanSelector
              name="gymMembershipPlanId"
              label="Plan de membresía *"
              activeOnly={true}
              onPlanSelect={setSelectedPlan}
            />
          </View>

          {/* Payment Method Selection */}
          <View className="mb-3">
            <PaymentMethodSelectorField name="paymentMethodId" label="Método de pago *" />
          </View>

          {/* Start Date */}
          <View className="mb-3">
            <FormDatePicker
              control={control}
              name="startDate"
              label="Fecha de inicio"
              placeholder="Seleccionar fecha de inicio"
              minimumDate={new Date()}
            />
          </View>

          {/* Discount */}
          <View className="mb-3">
            <FormInput
              control={control}
              name="discountPercentage"
              label="Descuento (%)"
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          {/* Custom Price */}
          <View className="mb-3">
            <FormInput
              control={control}
              name="customPrice"
              label="Precio personalizado (opcional)"
              placeholder="0.00"
              keyboardType="numeric"
              description="Si se especifica, este precio reemplazará el precio del plan"
            />
          </View>

          {/* Attachments */}
          <View className="mb-3">
            <FileSelector name="receiptIds" multi={true} label="Recibos adjuntos (opcional)" />
          </View>
        </View>
      </ScreenForm>
    </FormProvider>
  );
};
