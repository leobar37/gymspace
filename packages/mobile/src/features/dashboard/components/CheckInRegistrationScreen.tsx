import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { useMultiScreenContext } from '@/components/ui/multi-screen';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { VStack } from '@/components/ui/vstack';
import { useCheckInForm } from '@/features/dashboard/controllers/check-ins.controller';
import { useLoadingScreen } from '@/shared/loading-screen';
import type { Client } from '@gymspace/sdk';
import { ArrowLeftIcon, CheckCircleIcon, UserIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

export const CheckInRegistrationScreen: React.FC = () => {
  const { router } = useMultiScreenContext();
  const selectedClient = router.props?.client as Client | undefined;
  const [notes, setNotes] = useState('');
  const { handleCheckIn } = useCheckInForm();
  const { execute } = useLoadingScreen();

  const handleSubmitCheckIn = async () => {
    if (!selectedClient) return;

    await execute(handleCheckIn(selectedClient.id, notes.trim() || undefined), {
      action: 'Registrando check-in...',
      successMessage: `Check-in registrado exitosamente para ${selectedClient.name}`,
      errorFormatter: (error) => {
        if (error instanceof Error) {
          return error.message;
        }
        return 'Error al registrar check-in';
      },
      onSuccess: () => {
        router.navigate('client-list');
      },
      hideOnSuccess: true,
    });
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
      <VStack className="px-6 pt-3 border-b border-gray-200">
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
                </VStack>
                <Icon as={CheckCircleIcon} className="w-6 h-6 text-green-600" />
              </HStack>
            </Card>
          </VStack>

          {/* Notes Input */}
          <VStack className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Notas (opcional)</Text>
            <Textarea variant="default" size="md">
              <TextareaInput
                placeholder="Agregar una nota sobre el check-in..."
                value={notes}
                onChangeText={setNotes}
              />
            </Textarea>
            <Text className="text-xs text-gray-500">
              Puedes agregar observaciones, problemas de salud, objetivos del día, etc.
            </Text>
          </VStack>
        </VStack>
      </ScrollView>

      {/* Action Buttons */}
      <View className="border-t border-gray-200">
        <View className="p-6 border-t border-gray-200 bg-white">
          <HStack className="gap-3">
            <Button variant="outline" size="md" className="flex-1" onPress={handleGoBack}>
              <ButtonText>Volver</ButtonText>
            </Button>
            <Button variant="solid" size="md" className="flex-1" onPress={handleSubmitCheckIn}>
              <Icon as={CheckCircleIcon} className="w-5 h-5 text-white mr-2" />
              <ButtonText>Check-in</ButtonText>
            </Button>
          </HStack>
        </View>
      </View>
    </View>
  );
};
