import React, { useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, Alert } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Spinner } from '@/components/ui/spinner';
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from '@/components/ui/modal';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetItem, ActionsheetItemText } from '@/components/ui/actionsheet';
import { Icon } from '@/components/ui/icon';
import { EditIcon, XIcon, PauseIcon } from 'lucide-react-native';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { useContractsController } from '@/features/contracts/controllers/contracts.controller';
import { ContractStatus } from '@gymspace/sdk';
import { useForm, Controller } from 'react-hook-form';
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
  const router = useRouter();
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

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return { variant: 'success' as const, text: 'Activo' };
      case ContractStatus.PENDING:
        return { variant: 'info' as const, text: 'Pendiente' };
      case ContractStatus.EXPIRING_SOON:
        return { variant: 'warning' as const, text: 'Por vencer' };
      case ContractStatus.EXPIRED:
        return { variant: 'error' as const, text: 'Vencido' };
      case ContractStatus.CANCELLED:
        return { variant: 'muted' as const, text: 'Cancelado' };
      default:
        return { variant: 'muted' as const, text: status };
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: es });
  };

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

  const handleRenew = () => {
    router.push(`/contracts/${id}/renew`);
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

  const statusInfo = getStatusBadge(contract.status);
  const isFrozen = contract.freezeStartDate && contract.freezeEndDate;

  return (
    <>
      <Stack.Screen
        options={{
          title: `Contrato #${contract.contractNumber}`,
          headerBackTitle: 'Atrás',
          headerRight: () => (
            <Button
              onPress={() => setShowActionSheet(true)}
              variant="link"
              size="sm"
            >
              <ButtonText>Acciones</ButtonText>
            </Button>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView className="flex-1 bg-gray-50">
          <VStack className="p-4 gap-4">
            {/* Status Card */}
            <Card className="p-4">
                <HStack className="justify-between items-center">
                  <VStack>
                    <Text className="text-sm text-gray-500 mb-1">Estado del contrato</Text>
                    <Badge action={statusInfo.variant} size="lg">
                      <BadgeText>{statusInfo.text}</BadgeText>
                    </Badge>
                  </VStack>
                  {isFrozen && (
                    <Badge action="info">
                      <BadgeText>Congelado</BadgeText>
                    </Badge>
                  )}
                </HStack>
            </Card>

            {/* Contract Info */}
            <Card className="p-4">
                <Heading size="md" className="mb-4">Información del contrato</Heading>
                
                <VStack className="gap-3">
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Número:</Text>
                    <Text className="font-medium">{contract.contractNumber}</Text>
                  </HStack>

                  <HStack className="justify-between">
                    <Text className="text-gray-600">Fecha de inicio:</Text>
                    <Text className="font-medium">{formatDate(contract.startDate)}</Text>
                  </HStack>

                  <HStack className="justify-between">
                    <Text className="text-gray-600">Fecha de fin:</Text>
                    <Text className="font-medium">{formatDate(contract.endDate)}</Text>
                  </HStack>

                  {isFrozen && (
                    <>
                      <Divider className="my-2" />
                      <HStack className="justify-between">
                        <Text className="text-gray-600">Congelado desde:</Text>
                        <Text className="font-medium">{formatDate(contract.freezeStartDate!)}</Text>
                      </HStack>
                      <HStack className="justify-between">
                        <Text className="text-gray-600">Congelado hasta:</Text>
                        <Text className="font-medium">{formatDate(contract.freezeEndDate!)}</Text>
                      </HStack>
                    </>
                  )}
                </VStack>
            </Card>

            {/* Pricing Info */}
            <Card className="p-4">
                <Heading size="md" className="mb-4">Información de precios</Heading>
                
                <VStack className="gap-3">
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Precio base:</Text>
                    <Text className="font-medium">{formatPrice(contract.price)}</Text>
                  </HStack>

                  {contract.discountPercentage && contract.discountPercentage > 0 && (
                    <HStack className="justify-between">
                      <Text className="text-gray-600">Descuento:</Text>
                      <Text className="font-medium text-green-600">{contract.discountPercentage}%</Text>
                    </HStack>
                  )}

                  <Divider />

                  <HStack className="justify-between">
                    <Text className="font-semibold">Precio final:</Text>
                    <Text className="font-bold text-lg">{formatPrice(contract.finalPrice)}</Text>
                  </HStack>
                </VStack>
            </Card>

            {/* Actions */}
            {contract.status === ContractStatus.ACTIVE && (
              <VStack className="gap-3 mt-4">
                <Button onPress={handleRenew} variant="outline">
                  <ButtonText>Renovar contrato</ButtonText>
                </Button>
                
                {!isFrozen && (
                  <Button onPress={() => setShowFreezeModal(true)} variant="outline">
                    <ButtonText>Congelar contrato</ButtonText>
                  </Button>
                )}
                
                <Button
                  onPress={() => setShowCancelDialog(true)}
                  action="negative"
                  variant="outline"
                >
                  <ButtonText>Cancelar contrato</ButtonText>
                </Button>
              </VStack>
            )}
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
                
                <Controller
                  control={cancelForm.control}
                  name="reason"
                  render={({ field: { onChange, value } }) => (
                    <FormTextarea
                      label="Motivo de cancelación"
                      placeholder="Ingrese el motivo"
                      defaultValue={value}
                      onChangeText={onChange}
                      error={cancelForm.formState.errors.reason?.message}
                    />
                  )}
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
              router.push(`/contracts/${id}/edit`);
            }}>
              <Icon as={EditIcon} size="sm" className="mr-2" />
              <ActionsheetItemText>Editar contrato</ActionsheetItemText>
            </ActionsheetItem>

            {contract.status === ContractStatus.ACTIVE && !isFrozen && (
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