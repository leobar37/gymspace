import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useCheckInForm } from '@/controllers/check-ins.controller';
import { useDataSearch } from '@/hooks/useDataSearch';
import { useLoadingScreen, useLoadingScreenStore } from '@/shared/loading-screen';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useQuery } from '@tanstack/react-query';
import type { Client } from '@gymspace/sdk';
import { CheckCircleIcon, SearchIcon, UserIcon, XIcon } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

export const CheckInButton: React.FC = () => {
  const actionSheetRef = useRef<BottomSheetModal>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState('');

  const { handleCheckIn } = useCheckInForm();
  const { execute } = useLoadingScreen();
  const { sdk, currentGymId } = useGymSdk();

  // Fetch all active clients with contract status for local filtering
  const { data: allClients, isLoading } = useQuery({
    queryKey: ['checkInClients', currentGymId],
    queryFn: async () => {
      if (!currentGymId) throw new Error('No gym selected');
      const response = await sdk.clients.searchClientsForCheckIn({
        search: '',
        limit: 1000,
        page: 0,
        activeOnly: true,
        includeContractStatus: true,
      });
      return response.data;
    },
    enabled: !!currentGymId,
  });

  // Use local search hook
  const { searchInput, setSearchInput, filteredData, clearSearch } = useDataSearch({
    data: allClients || [],
    searchFields: (client) => [client.name || '', client.email || '', client.clientNumber || ''],
    searchPlaceholder: 'Buscar por nombre, email o número de cliente...',
  });

  // Check if client can check in
  const canClientCheckIn = useCallback(
    (
      client: Client,
    ): {
      canCheckIn: boolean;
      reason?: string;
    } => {
      // Check if client is active
      if (client.status !== 'active') {
        return {
          canCheckIn: false,
          reason: 'Cliente inactivo',
        };
      }

      // Check if client has active contracts
      if (!client.contracts || client.contracts.length === 0) {
        return {
          canCheckIn: false,
          reason: 'Sin membresía activa',
        };
      }

      // Check if any contract is valid
      const now = new Date();
      const hasValidContract = client.contracts.some((contract) => {
        if (contract.status !== 'active') return false;

        const startDate = new Date(contract.startDate);
        const endDate = new Date(contract.endDate);

        return now >= startDate && now <= endDate;
      });

      if (!hasValidContract) {
        return {
          canCheckIn: false,
          reason: 'Membresía expirada',
        };
      }

      return { canCheckIn: true };
    },
    [],
  );

  const handleCreateCheckIn = async () => {
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
      successActions: [
        {
          label: 'Nuevo Check-in',
          onPress: () => {
            resetForm();
          },
          variant: 'solid',
        },
      ],
      hideOnSuccess: false,
    });

    // Result handling is done by LoadingScreen
    // The success actions will handle navigation and form reset
  };

  const resetForm = () => {
    setSelectedClient(null);
    clearSearch();
    setNotes('');
  };

  const openSheet = () => {
    resetForm();
    actionSheetRef.current?.present();
  };

  const closeSheet = () => {
    actionSheetRef.current?.dismiss();
    resetForm();
  };

  const handleSelectClient = (client: Client) => {
    const checkInStatus = canClientCheckIn(client);

    if (!checkInStatus.canCheckIn) {
      // Show error using LoadingScreen store
      const { show, hide } = useLoadingScreenStore.getState();
      show('error', checkInStatus.reason || 'El cliente no puede hacer check-in', [
        {
          label: 'Entendido',
          onPress: () => {
            hide();
          },
          variant: 'solid',
        },
      ]);
      return;
    }

    setSelectedClient(client);
    const fullName = client.name;
    setSearchInput(fullName);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Pressable
        onPress={openSheet}
        className="absolute bottom-6 right-6 w-14 h-14 bg-green-600 rounded-full items-center justify-center shadow-lg"
        style={{
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        }}
      >
        <Icon as={CheckCircleIcon} className="w-7 h-7 text-white" />
      </Pressable>

      {/* Check-in ActionSheet */}
      <ActionSheet
        ref={actionSheetRef}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: 20,
        }}
        indicatorStyle={{
          width: 40,
          backgroundColor: '#E5E7EB',
          marginTop: 8,
        }}
        gestureEnabled={true}
        closeOnPressBack={true}
        closeOnTouchBackdrop={true}
      >
        <View className="min-h-[70vh] max-h-[90vh]">
          {/* Sheet Header */}
          <VStack className="p-6 border-b border-gray-200">
            <HStack className="justify-between items-center">
              <Heading className="text-xl font-bold text-gray-900">Registrar Check-in</Heading>
              <Pressable onPress={closeSheet} className="p-2">
                <Icon as={XIcon} className="w-6 h-6 text-gray-600" />
              </Pressable>
            </HStack>
          </VStack>

          {/* Sheet Content */}
          <ScrollView
            className="flex-1 p-6"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <VStack className="gap-6">
              {/* Search Input */}
              <VStack className="gap-2">
                <Text className="text-sm font-medium text-gray-700">Buscar Cliente</Text>
                <View className="relative">
                  <Input variant="outline" size="md">
                    <Icon
                      as={SearchIcon}
                      className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10"
                    />
                    <InputField
                      placeholder="Buscar por nombre, email o número de cliente..."
                      value={searchInput}
                      onChangeText={(text) => {
                        setSearchInput(text);
                        if (selectedClient && text !== selectedClient.name) {
                          setSelectedClient(null);
                        }
                      }}
                      className="pl-10"
                    />
                  </Input>
                </View>
              </VStack>

              {/* Search Results */}
              {searchInput.length > 0 && (
                <VStack className="gap-2">
                  {isLoading ? (
                    <HStack className="items-center justify-center py-4">
                      <Spinner className="text-blue-600" />
                      <Text className="ml-2 text-gray-600">Cargando clientes...</Text>
                    </HStack>
                  ) : filteredData && filteredData.length > 0 ? (
                    <VStack className="gap-2">
                      {filteredData.slice(0, 10).map((client) => {
                        const isSelected = selectedClient?.id === client.id;
                        const fullName = client.name || 'Sin nombre';
                        const checkInStatus = canClientCheckIn(client);

                        return (
                          <Pressable
                            key={client.id}
                            onPress={() => handleSelectClient(client)}
                            disabled={!checkInStatus.canCheckIn}
                          >
                            <Card
                              className={`p-3 ${
                                isSelected
                                  ? 'bg-green-50 border-green-500'
                                  : checkInStatus.canCheckIn
                                    ? 'bg-white'
                                    : 'bg-gray-50 opacity-60'
                              }`}
                            >
                              <HStack className="items-center gap-3">
                                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center">
                                  <Icon as={UserIcon} className="w-5 h-5 text-gray-600" />
                                </View>
                                <VStack className="flex-1">
                                  <Text className="font-medium text-gray-900">{fullName}</Text>
                                  {client.email && (
                                    <Text className="text-xs text-gray-500">{client.email}</Text>
                                  )}
                                  {client.clientNumber && (
                                    <Text className="text-xs text-gray-400">
                                      #{client.clientNumber}
                                    </Text>
                                  )}
                                  {!checkInStatus.canCheckIn && (
                                    <Text className="text-xs text-red-600 mt-1">
                                      {checkInStatus.reason}
                                    </Text>
                                  )}
                                </VStack>
                                {isSelected && (
                                  <Icon as={CheckCircleIcon} className="w-5 h-5 text-green-600" />
                                )}
                              </HStack>
                            </Card>
                          </Pressable>
                        );
                      })}
                    </VStack>
                  ) : (
                    <Text className="text-center text-gray-500 py-4">
                      No se encontraron clientes
                    </Text>
                  )}
                </VStack>
              )}

              {/* Notes Input */}
              {selectedClient && (
                <VStack className="gap-2">
                  <Text className="text-sm font-medium text-gray-700">Notas (opcional)</Text>
                  <Input variant="outline" size="md">
                    <InputField
                      placeholder="Agregar una nota..."
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </Input>
                </VStack>
              )}

              {/* Action Buttons */}
              <HStack className="gap-3 pt-4">
                <Button variant="outline" size="md" className="flex-1" onPress={closeSheet}>
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button
                  variant="solid"
                  size="md"
                  className="flex-1"
                  onPress={handleCreateCheckIn}
                  isDisabled={!selectedClient}
                >
                  <ButtonText className="text-white">Check-in</ButtonText>
                </Button>
              </HStack>
            </VStack>
          </ScrollView>
        </View>
      </ActionSheet>
    </>
  );
};
