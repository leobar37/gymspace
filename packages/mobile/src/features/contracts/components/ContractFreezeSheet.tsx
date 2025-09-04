import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useLoadingScreen } from '@/shared/loading-screen';
import { useContractsController } from '@/features/contracts/controllers/contracts.controller';
import { FreezeContractDto } from '@gymspace/sdk';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { X, Snowflake } from 'lucide-react-native';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import ActionSheet, { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { z } from 'zod';

const freezeSchema = z
  .object({
    freezeStartDate: z.date({
      required_error: 'La fecha de inicio es requerida',
      invalid_type_error: 'Fecha inválida',
    }),
    freezeEndDate: z.date({
      required_error: 'La fecha de fin es requerida',
      invalid_type_error: 'Fecha inválida',
    }),
    reason: z.string().optional(),
  })
  .refine((data) => data.freezeEndDate > data.freezeStartDate, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['freezeEndDate'],
  });

type FreezeFormData = z.infer<typeof freezeSchema>;

export const ContractFreezeSheet: React.FC<SheetProps<'contract-freeze'>> = ({
  sheetId,
  payload,
}) => {
  const { execute } = useLoadingScreen();
  const { freezeContract, isFreezingContract } = useContractsController();

  // Handle case where payload is not provided yet
  if (!payload) {
    return null;
  }

  const { contract, onSuccess } = payload;

  const form = useForm<FreezeFormData>({
    resolver: zodResolver(freezeSchema),
    defaultValues: {
      freezeStartDate: new Date(),
      freezeEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      reason: '',
    },
  });

  const freezeStartDate = form.watch('freezeStartDate');

  // Calculate freeze duration for display
  const calculateFreezeDays = () => {
    const start = form.watch('freezeStartDate');
    const end = form.watch('freezeEndDate');
    if (start && end) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (data: FreezeFormData) => {
    const freezeData: FreezeContractDto = {
      freezeStartDate: data.freezeStartDate.toISOString(),
      freezeEndDate: data.freezeEndDate.toISOString(),
      reason: data.reason || undefined,
    };

    await execute(
      new Promise((resolve, reject) => {
        freezeContract(
          { id: contract.id, data: freezeData },
          {
            onSuccess: (result) => {
              resolve(result);
              onSuccess?.();
              form.reset();
              SheetManager.hide(sheetId);
            },
            onError: reject,
          },
        );
      }),
      {
        action: 'Congelando contrato...',
        successMessage: 'Contrato congelado exitosamente',
        successActions: [
          {
            label: 'Ver contrato',
            onPress: () => router.push(`/contracts/${contract.id}`),
          },
        ],
      },
    );
  };

  return (
    <ActionSheet id={sheetId} gestureEnabled containerStyle={{ paddingBottom: 0 }}>
      <View className="bg-white" style={{ height: 650 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
          <HStack className="gap-2 items-center">
            <Icon as={Snowflake} size="md" className="text-blue-600" />
            <Heading size="lg">Congelar Contrato</Heading>
          </HStack>
          <Pressable onPress={() => SheetManager.hide(sheetId)} className="p-2">
            <Icon as={X} size="md" className="text-gray-500" />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }}
          style={{ flex: 1 }}>
          <FormProvider {...form}>
            <VStack className="p-4 gap-4">
              {/* Info Box */}
              <Box className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <HStack className="gap-2 mb-2">
                  <Icon as={Snowflake} size="sm" className="text-blue-600" />
                  <Text className="font-semibold text-blue-900">Información de Congelamiento</Text>
                </HStack>
                <Text className="text-sm text-blue-700">
                  El congelamiento permite pausar temporalmente el contrato. Durante este período,
                  el cliente no podrá acceder al gimnasio, pero el contrato se extenderá
                  automáticamente por la duración del congelamiento.
                </Text>
              </Box>

              {/* Current contract info */}
              <Box className="bg-gray-50 p-4 rounded-xl">
                <Text className="font-semibold text-gray-900 mb-2">Contrato Actual</Text>
                <VStack className="gap-1">
                  <HStack className="justify-between">
                    <Text className="text-sm text-gray-600">Cliente:</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {contract.gymClient?.name}
                    </Text>
                  </HStack>
                  <HStack className="justify-between">
                    <Text className="text-sm text-gray-600">Plan:</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {contract.gymMembershipPlan?.name}
                    </Text>
                  </HStack>
                  <HStack className="justify-between">
                    <Text className="text-sm text-gray-600">Vence:</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {new Date(contract.endDate).toLocaleDateString()}
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Freeze dates */}
              <FormDatePicker
                name="freezeStartDate"
                label="Fecha de inicio del congelamiento"
                placeholder="Seleccionar fecha de inicio"
                minimumDate={new Date()}
              />

              <FormDatePicker
                name="freezeEndDate"
                label="Fecha de fin del congelamiento"
                placeholder="Seleccionar fecha de fin"
                minimumDate={freezeStartDate || new Date()}
                maximumDate={
                  freezeStartDate
                    ? new Date(freezeStartDate.getTime() + 30 * 24 * 60 * 60 * 1000) // Max 30 days
                    : undefined
                }
              />
              {/* Duration display */}
              {calculateFreezeDays() > 0 && (
                <Box className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <HStack className="justify-between items-center">
                    <Text className="text-sm font-medium text-amber-900">
                      Duración del congelamiento:
                    </Text>
                    <Text className="text-lg font-bold text-amber-600">
                      {calculateFreezeDays()} días
                    </Text>
                  </HStack>
                  {calculateFreezeDays() > 30 && (
                    <Text className="text-xs text-amber-700 mt-2">
                      ⚠️ El congelamiento no puede exceder 30 días
                    </Text>
                  )}
                </Box>
              )}

              {/* Reason */}
              <FormTextarea
                name="reason"
                label="Motivo del congelamiento (opcional)"
                placeholder="Ej: Viaje, lesión, vacaciones, etc."
              />

              {/* Warning for renewals */}
              {contract.renewals && contract.renewals.length > 0 && (
                <Box className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <HStack className="gap-2 mb-2">
                    <Text className="text-amber-600">⚠️</Text>
                    <Text className="font-semibold text-amber-900">Renovación Programada</Text>
                  </HStack>
                  <Text className="text-sm text-amber-700">
                    Este contrato tiene una renovación programada. Si la renovación está configurada
                    para iniciar al finalizar el contrato actual, las fechas se ajustarán
                    automáticamente después del congelamiento.
                  </Text>
                </Box>
              )}
            </VStack>
          </FormProvider>
        </ScrollView>

        {/* Footer Actions - Fixed at bottom */}
        <View className="px-4 py-3 border-t border-gray-100 bg-white">
          <HStack className="gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onPress={() => SheetManager.hide(sheetId)}
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onPress={form.handleSubmit(handleSubmit)}
              isDisabled={isFreezingContract}
            >
              <Icon as={Snowflake} size="sm" className="mr-2" />
              <ButtonText>Congelar</ButtonText>
            </Button>
          </HStack>
        </View>
      </View>
    </ActionSheet>
  );
};

ContractFreezeSheet.displayName = 'ContractFreezeSheet';
