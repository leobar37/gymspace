import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { useMultiScreenContext } from '@/components/ui/multi-screen';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ClientsListGeneric } from '@/features/clients/components/ClientsList.generic';
import { useLoadingScreenStore } from '@/shared/loading-screen';
import type { Client } from '@gymspace/sdk';
import { SheetManager } from '@gymspace/sheet';
import { XIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

export const ClientListScreen: React.FC = () => {
  const { router } = useMultiScreenContext();

  // Helper function to check if client can check in
  const canClientCheckIn = (client: Client): { canSelect: boolean; reason?: string } => {
    // Check if client is active
    if (client.status !== 'active') {
      return {
        canSelect: false,
        reason: 'Cliente inactivo',
      };
    }

    // Check if client has active contracts
    if (!client.contracts || client.contracts.length === 0) {
      return {
        canSelect: false,
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
        canSelect: false,
        reason: 'Membresía expirada',
      };
    }

    return { canSelect: true };
  };

  const handleSelectClient = (client: Client) => {
    console.log('Selected client:', client);
    const checkInStatus = canClientCheckIn(client);

    if (!checkInStatus.canSelect) {
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
      console.log("Client can't check in:", checkInStatus.reason);
      return;
    }

    try {
      console.log('canClientCheckIn', checkInStatus);
      console.log('Navigating with client:', client);

      // Navigate to registration screen with selected client
      router.navigate('registration', { props: { client } });
    } catch (error) {
      console.log('Error navigating to registration screen:', error);
    }
  };

  const handleClose = () => {
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
      <View className="flex-1 px-6 py-4">
        <ClientsListGeneric
          onClientSelect={handleSelectClient}
          activeOnly={true}
          filterFunction={canClientCheckIn}
          searchPlaceholder="Buscar por nombre, email o número..."
          showCheckInStatus={true}
          isSheet={true}
          cardVariant="default"
          resultsMessage={{
            single: '1 cliente disponible para check-in',
            plural: '{count} clientes disponibles para check-in',
            noResults: 'No se encontraron clientes con esos criterios'
          }}
          emptyMessage="No hay clientes con membresía activa disponibles para check-in"
        />
      </View>
    </View>
  );
};