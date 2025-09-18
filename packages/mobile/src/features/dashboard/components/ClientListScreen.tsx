import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import { useDataSearch } from '@/hooks/useDataSearch';
import { useLoadingScreenStore } from '@/shared/loading-screen';
import { useMultiScreenContext } from '@/components/ui/multi-screen';
import { InputSearch } from '@/shared/input-search';
import { ClientCard } from '@/shared/components/ClientCard';
import type { Client } from '@gymspace/sdk';
import { XIcon, UsersIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SheetManager } from '@gymspace/sheet';

export const ClientListScreen: React.FC = () => {
  const { router } = useMultiScreenContext();

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

  // Display all clients by default, or filtered results when searching
  const displayClients = searchInput.length > 0 ? filteredData : clients;

  // Helper function to check if client can check in
  const canClientCheckIn = (client: Client): { canCheckIn: boolean; reason?: string } => {
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

    // Navigate to registration screen with selected client
    router.navigate('registration', { props: { client } });
  };

  const handleClose = () => {
    clearSearch();
    SheetManager.hide('check-in');
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
          <InputSearch
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Buscar por nombre, email o número..."
            onClear={clearSearch}
          />

          {/* Client List */}
          {isLoading ? (
            <HStack className="items-center justify-center py-8">
              <Spinner className="text-blue-600" />
              <Text className="ml-2 text-gray-600">Cargando clientes...</Text>
            </HStack>
          ) : displayClients && displayClients.length > 0 ? (
            <VStack>
              <Text className="text-sm text-gray-500 mb-2">
                {searchInput.length > 0
                  ? `${displayClients.length} cliente${displayClients.length !== 1 ? 's' : ''} encontrado${displayClients.length !== 1 ? 's' : ''}`
                  : `${displayClients.length} cliente${displayClients.length !== 1 ? 's' : ''} activo${displayClients.length !== 1 ? 's' : ''}`
                }
              </Text>
              {displayClients.map((client) => {
                const checkInStatus = canClientCheckIn(client);

                return (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onPress={handleSelectClient}
                    showCheckInStatus={true}
                    canCheckIn={checkInStatus.canCheckIn}
                    checkInReason={checkInStatus.reason}
                  />
                );
              })}
            </VStack>
          ) : (
            <VStack className="items-center justify-center py-8">
              <Icon as={UsersIcon} className="w-12 h-12 text-gray-300 mb-4" />
              <Text className="text-gray-500 text-center">
                {searchInput.length > 0 
                  ? 'No se encontraron clientes con esos criterios'
                  : 'No hay clientes activos en el gimnasio'
                }
              </Text>
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </View>
  );
};