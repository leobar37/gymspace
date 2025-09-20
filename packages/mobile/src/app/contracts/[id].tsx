import { FormTextarea } from '@/components/forms/FormTextarea';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  ContractDetailHeader,
  ContractInfoCard,
  ContractPaymentMethodCard,
  ContractPricingCard,
  ContractReceiptsCard,
  ContractStatusCard,
  useContractsController,
} from '@/features/contracts';
import { ContractStatus } from '@gymspace/sdk';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams } from 'expo-router';
import { PauseIcon, RefreshCwIcon, XIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Alert, ScrollView } from 'react-native';
import { SheetManager } from '@gymspace/sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { useFormatPrice } from '@/config/ConfigContext';

// Form schema for cancel
const cancelSchema = z.object({
  reason: z.string().min(1, 'El motivo es requerido'),
});

type CancelFormData = z.infer<typeof cancelSchema>;

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const formatPriceConfig = useFormatPrice();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { useContractDetail, cancelContract, isCancellingContract } = useContractsController();

  const { data: contract, isLoading } = useContractDetail(id!);

  // Cancel form
  const cancelForm = useForm<CancelFormData>({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      reason: '',
    },
  });
  console.log('contract', JSON.stringify(contract, null, 2));

  const formatPrice = formatPriceConfig;

  const handleCancel = async (data: CancelFormData) => {
    cancelContract(
      { id: id!, reason: data.reason },
      {
        onSuccess: () => {
          setShowCancelDialog(false);
          Alert.alert('Éxito', 'El contrato ha sido cancelado');
        },
        onError: (error: any) => {
          Alert.alert('Error', error.response?.data?.message || 'No se pudo cancelar el contrato');
        },
      },
    );
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
      </Box>
    );
  }

  return (
    <>
      <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
        <ScrollView className="flex-1 bg-gray-50">
          <VStack className="p-4 gap-4">
            <ContractStatusCard contract={contract} />
            <ContractInfoCard contract={contract} />
            <ContractPaymentMethodCard contract={contract} />
            <ContractPricingCard contract={contract} formatPrice={formatPrice} />
            <ContractReceiptsCard contract={contract} />

            {/* Actions Section */}
            <Card className="p-4">
              <Text className="text-sm font-semibold text-gray-700 mb-3">Acciones</Text>
              <VStack className="gap-3">
                {/* Renew Button */}
                {(contract.status === ContractStatus.ACTIVE ||
                  contract.status === ContractStatus.EXPIRING_SOON) &&
                  (!contract.renewals || contract.renewals.length === 0) && (
                    <Button
                      onPress={() =>
                        SheetManager.show('contract-renewal', {
                          contract,
                          onSuccess: () => {
                            // Refetch contract data after successful renewal
                          },
                        })
                      }
                      variant="solid"
                      className="w-full"
                    >
                      <Icon as={RefreshCwIcon} size="sm" className="mr-2" />
                      <ButtonText>Renovar Contrato</ButtonText>
                    </Button>
                  )}

                {/* Freeze Button */}
                {contract.status === ContractStatus.ACTIVE && !contract.freezeStartDate && (
                  <Button
                    onPress={() =>
                      SheetManager.show('contract-freeze', {
                        contract,
                        onSuccess: () => {
                          // Refetch contract data after successful freeze
                        },
                      })
                    }
                    variant="outline"
                    className="w-full"
                  >
                    <Icon as={PauseIcon} size="sm" className="mr-2" />
                    <ButtonText>Congelar Contrato</ButtonText>
                  </Button>
                )}

                {/* Cancel Button */}
                {contract.status === ContractStatus.ACTIVE && (
                  <Button
                    onPress={() => setShowCancelDialog(true)}
                    action="negative"
                    variant="outline"
                    className="w-full"
                  >
                    <Icon as={XIcon} size="sm" className="mr-2" />
                    <ButtonText>Cancelar Contrato</ButtonText>
                  </Button>
                )}
              </VStack>
            </Card>
          </VStack>
        </ScrollView>

        {/* Cancel Dialog */}
        <AlertDialog isOpen={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <Heading size="md">Cancelar contrato</Heading>
            </AlertDialogHeader>
            <AlertDialogBody>
              <FormProvider {...cancelForm}>
                <VStack className="gap-4">
                  <Text>
                    ¿Está seguro que desea cancelar este contrato? Esta acción no se puede deshacer.
                  </Text>

                  <FormTextarea
                    name="reason"
                    label="Motivo de cancelación"
                    placeholder="Ingrese el motivo"
                  />
                </VStack>
              </FormProvider>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onPress={() => setShowCancelDialog(false)} variant="outline" className="mr-3">
                <ButtonText>No, mantener</ButtonText>
              </Button>
              <Button
                onPress={cancelForm.handleSubmit(handleCancel)}
                action="negative"
                isDisabled={isCancellingContract}
              >
                <ButtonText>Sí, cancelar</ButtonText>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Renewal Drawer */}
      </SafeAreaView>
    </>
  );
}
