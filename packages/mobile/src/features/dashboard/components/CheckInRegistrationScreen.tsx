import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useMultiScreenContext } from '@/components/ui/multi-screen';
import { ArrowLeftIcon, CheckCircleIcon, UserIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useCheckInForm } from '@/features/dashboard/controllers/check-ins.controller';
import { useLoadingScreen } from '@/shared/loading-screen';
import type { Client } from '@gymspace/sdk';
import { SheetManager } from '@gymspace/sheet';

export const CheckInRegistrationScreen: React.FC = () => {
  const { router } = useMultiScreenContext();
  const selectedClient = router.props?.client as Client | undefined;
  const [notes, setNotes] = useState('');
  const { handleCheckIn } = useCheckInForm();
  const { execute } = useLoadingScreen();

  const handleSubmitCheckIn = async () => {
    if (!selectedClient) return;

    await execute(
      handleCheckIn(selectedClient.id, notes.trim() || undefined),
      {
        action: 'Registrando check-in...',
        successMessage: `Check-in registrado exitosamente para ${selectedClient.name}`,
        errorFormatter: (error) => {
          if (error instanceof Error) {
            return error.message;
          }
          return 'Error al registrar check-in';
        },
        successActions: [
          {
            label: 'Nuevo Check-in',
            onPress: () => {
              setNotes('');
              router.navigate('client-list');
            },
            variant: 'solid',
          },
          {
            label: 'Cerrar',
            onPress: () => {
              SheetManager.hide('check-in');
            },
            variant: 'outline',
          },
        ],
        hideOnSuccess: false,
      }
    );
  };

  const handleGoBack = () => {
    router.navigate('client-list');
  };

  if (!selectedClient) {
    // Should not happen, but fallback to client list
    router.navigate('client-list');
    return null;
  }

  const fullName = selectedClient.name || 'Sin nombre';

  return (
    <View className="bg-white flex-1">
      {/* Header */}
      <VStack className="p-6 border-b border-gray-200">
        <HStack className="justify-between items-center">
          <HStack className="items-center gap-3">
            <Pressable onPress={handleGoBack} className="p-2 -ml-2">
              <Icon as={ArrowLeftIcon} className="w-6 h-6 text-gray-600" />
            </Pressable>
            <Text className="text-xl font-bold text-gray-900">Registrar Check-in</Text>
          </HStack>
        </HStack>
      </VStack>

      {/* Content */}
      <ScrollView
        className="flex-1 p-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack className="gap-6">
          {/* Selected Client Card */}
          <VStack className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Cliente Seleccionado</Text>
            <Card className="p-4 bg-green-50 border-green-200">
              <HStack className="items-center gap-3">
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
                  <Icon as={UserIcon} className="w-6 h-6 text-green-600" />
                </View>
                <VStack className="flex-1">
                  <Text className="font-semibold text-gray-900">{fullName}</Text>
                  {selectedClient.email && (
                    <Text className="text-sm text-gray-600">{selectedClient.email}</Text>
                  )}
                  {selectedClient.clientNumber && (
                    <Text className="text-sm text-gray-500">
                      {selectedClient.clientNumber}
                    </Text>
                  )}
                </VStack>
                <Icon as={CheckCircleIcon} className="w-6 h-6 text-green-600" />
              </HStack>
            </Card>
          </VStack>

          {/* Notes Input */}
          <VStack className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Notas (opcional)</Text>
            <Input variant="outline" size="md">
              <InputField
                placeholder="Agregar una nota sobre el check-in..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Input>
            <Text className="text-xs text-gray-500">
              Puedes agregar observaciones, problemas de salud, objetivos del día, etc.
            </Text>
          </VStack>

          {/* Check-in Information */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <VStack className="gap-2">
              <HStack className="items-center gap-2">
                <Icon as={CheckCircleIcon} className="w-5 h-5 text-blue-600" />
                <Text className="font-medium text-blue-900">Información del Check-in</Text>
              </HStack>
              <Text className="text-sm text-blue-700">
                • El check-in se registrará con la fecha y hora actual
              </Text>
              <Text className="text-sm text-blue-700">
                • El cliente aparecerá en la lista de "Actualmente en el gimnasio"
              </Text>
              <Text className="text-sm text-blue-700">
                • Se enviará una notificación al cliente (si está habilitada)
              </Text>
            </VStack>
          </Card>
        </VStack>
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-6 border-t border-gray-200">
        <HStack className="gap-3">
          <Button variant="outline" size="md" className="flex-1" onPress={handleGoBack}>
            <ButtonText>Volver</ButtonText>
          </Button>
          <Button
            variant="solid"
            size="md"
            className="flex-1"
            onPress={handleSubmitCheckIn}
          >
            <Icon as={CheckCircleIcon} className="w-5 h-5 text-white mr-2" />
            <ButtonText>Registrar Check-in</ButtonText>
          </Button>
        </HStack>
      </View>
    </View>
  );
};