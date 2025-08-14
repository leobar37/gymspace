import React, { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Alert } from 'react-native';
import { format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from '@/components/ui/modal';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetItem, ActionsheetItemText } from '@/components/ui/actionsheet';
import { Icon } from '@/components/ui/icon';
import { EditIcon, XIcon, PauseIcon } from 'lucide-react-native';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { 
  useContractsController,
  ContractDetailHeader,
  ContractStatusCard,
  ContractInfoCard,
  ContractPricingCard,
  ContractReceiptsCard,
  ContractActionsCard
} from '@/features/contracts';
import { ContractStatus } from '@gymspace/sdk';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormatPrice } from '@/config/ConfigContext';

// Form schemas
const freezeSchema = z.object({
  freezeStartDate: z.string().min(1, 'La fecha de inicio es requerida'),
  freezeEndDate: z.string().min(1, 'La fecha de fin es requerida'),
  reason: z.string().optional(),
});

const cancelSchema = z.object({
  reason: z.string().min(1, 'El motivo es requerido'),
});

type FreezeFormData = z.infer<typeof freezeSchema>;
type CancelFormData = z.infer<typeof cancelSchema>;

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const formatPriceConfig = useFormatPrice();
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const {
    useContractDetail,
    freezeContract,
    isFreezingContract,
    cancelContract,
    isCancellingContract,
  } = useContractsController();

  const { data: contract, isLoading } = useContractDetail(id!);

  // Freeze form
  const freezeForm = useForm<FreezeFormData>({
    resolver: zodResolver(freezeSchema),
    defaultValues: {
      freezeStartDate: format(new Date(), 'yyyy-MM-dd'),
      freezeEndDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      reason: '',
    },
  });

  // Cancel form
  const cancelForm = useForm<CancelFormData>({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      reason: '',
    },
  });

  const formatPrice = formatPriceConfig;

  const handleFreeze = async (data: FreezeFormData) => {
    freezeContract(
      { 
        id: id!, 
        data: {
          freezeStartDate: data.freezeStartDate,
          freezeEndDate: data.freezeEndDate,
          reason: data.reason
        }
      },
      {
        onSuccess: () => {
          setShowFreezeModal(false);
          Alert.alert('Éxito', 'El contrato ha sido congelado');
        },
        onError: (error: any) => {
          Alert.alert('Error', error.response?.data?.message || 'No se pudo congelar el contrato');
        },
      }
    );
  };

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
      }
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
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <ContractDetailHeader 
          contract={contract}
          onMenuPress={() => setShowActionSheet(true)}
        />
        
        <ScrollView className="flex-1 bg-gray-50">
          <VStack className="p-4 gap-4">
            <ContractStatusCard contract={contract} />
            <ContractInfoCard contract={contract} />
            <ContractPricingCard contract={contract} formatPrice={formatPrice} />
            <ContractReceiptsCard contract={contract} />
            <ContractActionsCard 
              contract={contract}
              onFreezePress={() => setShowFreezeModal(true)}
              onCancelPress={() => setShowCancelDialog(true)}
            />
          </VStack>
        </ScrollView>


        {/* Freeze Modal */}
        <Modal
          isOpen={showFreezeModal}
          onClose={() => setShowFreezeModal(false)}
          size="lg"
        >
          <ModalBackdrop />
          <ModalContent>
            <ModalHeader>
              <Heading size="md">Congelar contrato</Heading>
              <ModalCloseButton />
            </ModalHeader>
            <ModalBody>
              <VStack className="gap-4">
                <FormInput
                  control={freezeForm.control}
                  name="freezeStartDate"
                  label="Fecha de inicio"
                  placeholder="YYYY-MM-DD"
                />

                <FormInput
                  control={freezeForm.control}
                  name="freezeEndDate"
                  label="Fecha de fin"
                  placeholder="YYYY-MM-DD"
                />

                <FormTextarea
                  control={freezeForm.control}
                  name="reason"
                  label="Motivo (opcional)"
                  placeholder="Ingrese el motivo del congelamiento"
                />
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button
                onPress={() => setShowFreezeModal(false)}
                variant="outline"
                className="mr-3"
              >
                <ButtonText>Cancelar</ButtonText>
              </Button>
              <Button
                onPress={freezeForm.handleSubmit(handleFreeze)}
                isDisabled={isFreezingContract}
              >
                <ButtonText>Congelar</ButtonText>
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Cancel Dialog */}
        <AlertDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
        >
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <Heading size="md">Cancelar contrato</Heading>
            </AlertDialogHeader>
            <AlertDialogBody>
              <VStack className="gap-4">
                <Text>
                  ¿Está seguro que desea cancelar este contrato? Esta acción no se puede deshacer.
                </Text>
                
                <FormTextarea
                  control={cancelForm.control}
                  name="reason"
                  label="Motivo de cancelación"
                  placeholder="Ingrese el motivo"
                />
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                onPress={() => setShowCancelDialog(false)}
                variant="outline"
                className="mr-3"
              >
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

        {/* Action Sheet */}
        <Actionsheet isOpen={showActionSheet} onClose={() => setShowActionSheet(false)}>
          <ActionsheetBackdrop />
          <ActionsheetContent>
            <ActionsheetDragIndicator />
            
            <ActionsheetItem onPress={() => {
              setShowActionSheet(false);
              // router.push(`/contracts/${id}/edit`);
            }}>
              <Icon as={EditIcon} size="sm" className="mr-2" />
              <ActionsheetItemText>Editar contrato</ActionsheetItemText>
            </ActionsheetItem>

            {contract.status === ContractStatus.ACTIVE && !contract.freezeStartDate && (
              <ActionsheetItem onPress={() => {
                setShowActionSheet(false);
                setShowFreezeModal(true);
              }}>
                <Icon as={PauseIcon} size="sm" className="mr-2" />
                <ActionsheetItemText>Congelar contrato</ActionsheetItemText>
              </ActionsheetItem>
            )}

            {contract.status === ContractStatus.ACTIVE && (
              <ActionsheetItem onPress={() => {
                setShowActionSheet(false);
                setShowCancelDialog(true);
              }}>
                <Icon as={XIcon} size="sm" className="mr-2 text-red-500" />
                <ActionsheetItemText className="text-red-500">Cancelar contrato</ActionsheetItemText>
              </ActionsheetItem>
            )}
          </ActionsheetContent>
        </Actionsheet>

      </SafeAreaView>
    </>
  );
}