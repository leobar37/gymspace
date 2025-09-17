import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import { useDataSearch } from '@/hooks/useDataSearch';
import { useLoadingScreenStore } from '@/shared/loading-screen';
import { useMultiScreenContext } from '@/components/ui/multi-screen';
import type { Client } from '@gymspace/sdk';
import { CheckCircleIcon, SearchIcon, UserIcon, XIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useCheckIn } from '../contexts/CheckInContext';

export const ClientListScreen: React.FC = () => {
  const { router } = useMultiScreenContext();
  const { selectClient, canClientCheckIn } = useCheckIn();

  // Get clients using the proper controller with limit 1000
  const { useClientsList } = useClientsController();
  
  const { data: clientsResponse, isLoading } = useClientsList({
    limit: 1000,
    page: 1,
    activeOnly: true,
    includeContractStatus: true,
  });

  const clients = clientsResponse?.data || [];

  // Local search using useDataSearch
  const { searchInput, setSearchInput, filteredData, clearSearch } = useDataSearch({
    data: clients,
    searchFields: (client) => [client.name || '', client.email || '', client.clientNumber || ''],
    searchPlaceholder: 'Buscar por nombre, email o número de cliente...',
  });

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

    // Select client in context and navigate to registration screen
    selectClient(client);
    router.navigate('registration');
  };

  const handleClose = () => {
    clearSearch();
    router.navigate('close'); // This will close the sheet
  };

  return (
    <View className="bg-white flex-1">
      {/* Header */}
      <VStack className="p-6 border-b border-gray-200">
        <HStack className="justify-between items-center">
          <Text className="text-xl font-bold text-gray-900">Seleccionar Cliente</Text>
          <Pressable onPress={handleClose} className="p-2">
            <Icon as={XIcon} className="w-6 h-6 text-gray-600" />
          </Pressable>
        </HStack>
      </VStack>

      {/* Content */}
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
                  onChangeText={setSearchInput}
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
                            checkInStatus.canCheckIn
                              ? 'bg-white hover:bg-gray-50'
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
                            {checkInStatus.canCheckIn && (
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

          {/* Instructions when no search */}
          {searchInput.length === 0 && (
            <VStack className="items-center justify-center py-8">
              <Icon as={SearchIcon} className="w-12 h-12 text-gray-300 mb-4" />
              <Text className="text-gray-500 text-center">
                Escribe el nombre, email o número del cliente para comenzar la búsqueda
              </Text>
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </View>
  );
};