import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { FormSwitch } from '@/components/forms/FormSwitch';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useFormatPrice } from '@/config/ConfigContext';
import { useLoadingScreen } from '@/shared/loading-screen';
import { useContractsController } from '@/features/contracts/controllers/contracts.controller';
import { Contract, RenewContractDto } from '@gymspace/sdk';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { Fragment } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { SheetManager } from '@gymspace/sheet';
import { z } from 'zod';

const renewalSchema = z.object({
  customPrice: z.number().positive().optional().nullable(),
  discountPercentage: z.number().min(0).max(100).optional().nullable(),
  applyAtEndOfContract: z.boolean().default(true),
  startDate: z.date().optional().nullable(),
  notes: z.string().optional(),
});

type RenewalFormData = z.infer<typeof renewalSchema>;

interface ContractRenewalFormProps {
  contract?: Contract;
  onSuccess?: () => void;
}

export const ContractRenewalForm: React.FC<ContractRenewalFormProps> = (props) => {
  const { contract, onSuccess } = props;
  const formatPrice = useFormatPrice();
  const { execute } = useLoadingScreen();
  const { renewContract, isRenewingContract } = useContractsController();

  if (!contract) {
    return null;
  }

  const handleSuccess = () => {
    onSuccess?.();
    SheetManager.hide('contract-renewal');
  };

  const handleCancel = () => {
    SheetManager.hide('contract-renewal');
  };

  const form = useForm<RenewalFormData>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      customPrice: null,
      discountPercentage: null,
      applyAtEndOfContract: true,
      startDate: null,
      notes: '',
    },
  });

  const applyAtEndOfContract = form.watch('applyAtEndOfContract');
  const customPrice = form.watch('customPrice');
  const discountPercentage = form.watch('discountPercentage');

  const calculateFinalPrice = () => {
    const basePrice = customPrice || contract.gymMembershipPlan?.basePrice || 0;
    if (discountPercentage) {
      return Number(basePrice) * (1 - discountPercentage / 100);
    }
    return basePrice;
  };

  const handleSubmit = async (data: RenewalFormData) => {
    const renewalData: RenewContractDto = {
      customPrice: data.customPrice || undefined,
      discountPercentage: data.discountPercentage || undefined,
      applyAtEndOfContract: data.applyAtEndOfContract,
      startDate:
        !data.applyAtEndOfContract && data.startDate ? data.startDate.toISOString() : undefined,
      notes: data.notes || undefined,
    };

    await execute(
      new Promise((resolve, reject) => {
        renewContract(
          { id: contract.id, data: renewalData },
          {
            onSuccess: (result) => {
              resolve(result);
              handleSuccess();
              form.reset();
            },
            onError: reject,
          },
        );
      }),
      {
        action: 'Renovando contrato...',
        successMessage: 'Contrato renovado exitosamente',
        successActions: [
          {
            label: 'Ver contrato',
            onPress: () => router.push(`/contracts/${contract.id}`),
          },
        ],
      },
    );
  };

  const allowCustomPrice = (contract.gymMembershipPlan as any)?.allowsCustomPricing ?? false;
  console.log('contract.gymMembershipPlan', JSON.stringify(contract.gymMembershipPlan, null, 3));

  return (
    <View className="flex-1 pb-6">
      <FormProvider {...form}>
        <VStack className="p-4 gap-4">
          <Box className="bg-blue-50 p-4 rounded-xl">
            <Text className="font-semibold text-blue-900 mb-3">Contrato Actual</Text>
            <VStack className="gap-2">
              <HStack className="justify-between">
                <Text className="text-sm text-blue-700">Plan:</Text>
                <Text className="text-sm font-medium text-blue-900">
                  {contract.gymMembershipPlan?.name}
                </Text>
              </HStack>
              <HStack className="justify-between">
                <Text className="text-sm text-blue-700">Precio Base:</Text>
                <Text className="text-sm font-medium text-blue-900">
                  {formatPrice(contract.gymMembershipPlan?.basePrice || 0)}
                </Text>
              </HStack>
              <HStack className="justify-between">
                <Text className="text-sm text-blue-700">Vence:</Text>
                <Text className="text-sm font-medium text-blue-900">
                  {new Date(contract.endDate).toLocaleDateString()}
                </Text>
              </HStack>
            </VStack>
          </Box>

          {/* {allowCustomPrice && }
           */}
          {allowCustomPrice && (
            <Fragment>
              <VStack className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">Precio Personalizado</Text>
                <Controller
                  control={form.control}
                  name="customPrice"
                  render={({ field: { onChange, value } }) => (
                    <Input size="lg" className="bg-gray-50">
                      <InputField
                        placeholder={`Base: ${formatPrice(contract.gymMembershipPlan?.basePrice || 0)}`}
                        value={value?.toString() || ''}
                        onChangeText={(text) => {
                          const num = parseFloat(text);
                          onChange(isNaN(num) ? null : num);
                        }}
                        keyboardType="numeric"
                      />
                    </Input>
                  )}
                />
              </VStack>
              <VStack className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">Descuento (%)</Text>
                <Controller
                  control={form.control}
                  name="discountPercentage"
                  render={({ field: { onChange, value } }) => (
                    <Input size="lg" className="bg-gray-50">
                      <InputField
                        placeholder="0-100"
                        value={value?.toString() || ''}
                        onChangeText={(text) => {
                          const num = parseFloat(text);
                          onChange(isNaN(num) ? null : num);
                        }}
                        keyboardType="numeric"
                      />
                    </Input>
                  )}
                />
              </VStack>
            </Fragment>
          )}

          <Box className="bg-green-50 p-4 rounded-xl border border-green-200">
            <HStack className="justify-between items-center">
              <Text className="font-semibold text-green-900">Precio Final:</Text>
              <Text className="text-2xl font-bold text-green-600">
                {formatPrice(calculateFinalPrice())}
              </Text>
            </HStack>
          </Box>

          <VStack className="gap-3">
            <FormSwitch name="applyAtEndOfContract" label="Aplicar al finalizar contrato actual" />
            {applyAtEndOfContract && (
              <Text className="text-xs text-gray-500 -mt-2 ml-12">
                La renovación iniciará cuando termine el contrato actual
              </Text>
            )}

            {!applyAtEndOfContract && (
              <FormDatePicker
                name="startDate"
                label="Fecha de inicio"
                placeholder="Seleccionar fecha"
                minimumDate={new Date()}
              />
            )}
          </VStack>

          <FormTextarea
            name="notes"
            label="Notas (opcional)"
            placeholder="Notas adicionales sobre la renovación"
          />

          {contract.renewals && contract.renewals.length > 0 && (
            <Box className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <HStack className="gap-2 mb-2">
                <Text className="text-amber-600">⚠️</Text>
                <Text className="font-semibold text-amber-900">Renovación Existente</Text>
              </HStack>
              <Text className="text-sm text-amber-700 mb-3">
                Ya existe una renovación programada para este contrato.
              </Text>
              {contract.renewals.map((renewal) => (
                <Box key={renewal.id} className="bg-white p-2 rounded-lg">
                  <Text className="text-xs text-gray-600">
                    Inicio: {new Date(renewal.startDate).toLocaleDateString()}
                  </Text>
                  <Text className="text-xs text-gray-600">
                    Precio: {formatPrice(renewal.finalPrice || 0)}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </VStack>
      </FormProvider>

      <View className="px-4 py-3 border-t border-gray-100 bg-white">
        <HStack className="gap-3">
          <Button variant="outline" size="lg" className="flex-1" onPress={handleCancel}>
            <ButtonText>Cancelar</ButtonText>
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onPress={form.handleSubmit(handleSubmit)}
            isDisabled={(contract.renewals && contract.renewals.length > 0) || isRenewingContract}
          >
            <ButtonText>Renovar Contrato</ButtonText>
          </Button>
        </HStack>
      </View>
    </View>
  );
};

ContractRenewalForm.displayName = 'ContractRenewalForm';
