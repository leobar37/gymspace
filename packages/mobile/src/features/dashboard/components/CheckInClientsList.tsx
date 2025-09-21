import { Badge, BadgeText } from '@/components/ui/badge';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useDataSearch } from '@/hooks/useDataSearch';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { ClientCard } from '@/shared/components/ClientCard';
import { InputSearch } from '@/shared/input-search';
import { useLoadingScreenStore } from '@/shared/loading-screen';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import type { Client } from '@gymspace/sdk';
import { CalendarIcon, UsersIcon } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useClientsController } from '../../clients/controllers/clients.controller';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

interface CheckInClientsListProps {
  onClientSelect?: (client: Client) => void;
}

export const CheckInClientsList: React.FC<CheckInClientsListProps> = ({
  onClientSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const { useClientsList } = useClientsController();

  // Get current date formatted in Spanish using dayjs
  const getCurrentDateFormatted = () => {
    dayjs.locale('es');
    return dayjs().format('dddd, D [de] MMMM [de] YYYY');
  };

  // Query for pending clients (not checked in today)
  const pendingQuery = useClientsList({
    page: 1,
    limit: 1000,
    notCheckedInToday: true,
    activeOnly: true,
    includeContractStatus: true,
  });

  // Query for completed clients (checked in today)
  const completedQuery = useClientsList({
    page: 1,
    limit: 1000,
    checkedInToday: true,
  });

  // Process pending clients data
  const pendingClients = useMemo(() => {
    return pendingQuery.data?.data || [];
  }, [pendingQuery.data]);

  // Process completed clients data
  const completedClients = useMemo(() => {
    return completedQuery.data?.data || [];
  }, [completedQuery.data]);

  // Client validation logic (redundant but kept for consistency)
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

  // Local search for pending clients
  const pendingSearch = useDataSearch({
    data: pendingClients,
    searchFields: (client) => [
      client.name || '',
      client.email || '',
      client.clientNumber || '',
      client.documentValue || '',
      client.phone || '',
    ],
    searchPlaceholder: 'Buscar cliente...',
  });

  // Local search for completed clients
  const completedSearch = useDataSearch({
    data: completedClients,
    searchFields: (client) => [
      client.name || '',
      client.email || '',
      client.clientNumber || '',
      client.documentValue || '',
      client.phone || '',
    ],
    searchPlaceholder: 'Buscar cliente...',
  });

  // Get current search based on active tab
  const currentSearch = activeTab === 'pending' ? pendingSearch : completedSearch;
  const currentClients = currentSearch.searchInput.length > 0 
    ? currentSearch.filteredData 
    : (activeTab === 'pending' ? pendingClients : completedClients);

  const handleSelectClient = (client: Client) => {
    if (activeTab === 'completed') {
      // Completed clients are not selectable, show informative message
      return;
    }

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
      return;
    }

    onClientSelect?.(client);
  };

  const renderClientItem = (client: Client) => {
    const filterResult = canClientCheckIn(client);
    const isDisabled = activeTab === 'completed' || !filterResult.canSelect;

    return (
      <ClientCard
        key={client.id}
        client={client}
        onPress={() => handleSelectClient(client)}
        disabled={isDisabled}
        showCheckInStatus={activeTab === 'pending'}
        canCheckIn={filterResult.canSelect}
        checkInReason={filterResult.reason}
        variant="complete"
      />
    );
  };

  const renderEmptyState = () => (
    <VStack className="items-center justify-center py-8">
      <Icon as={UsersIcon} className="w-12 h-12 text-gray-300 mb-4" />
      <Text className="text-gray-500 text-center mb-2">
        {activeTab === 'pending' 
          ? currentSearch.searchInput.length > 0
            ? 'No se encontraron clientes pendientes'
            : 'No hay clientes pendientes de check-in'
          : currentSearch.searchInput.length > 0
            ? 'No se encontraron clientes con check-in'
            : 'No hay clientes con check-in hoy'
        }
      </Text>
      {activeTab === 'pending' && currentSearch.searchInput.length === 0 && (
        <Text className="text-gray-400 text-center text-sm">
          Los clientes con membresía activa aparecerán aquí
        </Text>
      )}
    </VStack>
  );

  const isLoading = pendingQuery.isLoading || completedQuery.isLoading;

  if (isLoading) {
    return (
      <VStack className="flex-1 items-center justify-center mt-6">
        <Spinner size="large" />
        <Text className="mt-2 text-gray-600">Cargando clientes...</Text>
      </VStack>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Fixed Header */}
      <VStack className="px-6 py-4 border-b border-gray-200">
        {/* Title and Date */}
        <VStack className="mb-4">
          <Text className="text-xl font-bold text-gray-900">Check-In de Clientes</Text>
          <HStack className="items-center gap-2 mt-1">
            <Icon as={CalendarIcon} className="w-4 h-4 text-gray-500" />
            <Text className="text-sm text-gray-600 capitalize">
              {getCurrentDateFormatted()}
            </Text>
          </HStack>
        </VStack>

        {/* Tabs */}
        <HStack className="gap-2 mb-4">
          <Pressable
            onPress={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-4 rounded-lg border ${
              activeTab === 'pending'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <HStack className="items-center justify-center gap-2">
              <Text
                className={`font-medium ${
                  activeTab === 'pending' ? 'text-blue-700' : 'text-gray-600'
                }`}
              >
                Pendientes
              </Text>
              <Badge
                variant="solid"
                action={activeTab === 'pending' ? 'info' : 'muted'}
                size="sm"
              >
                <BadgeText>{pendingClients.length}</BadgeText>
              </Badge>
            </HStack>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('completed')}
            className={`flex-1 py-3 px-4 rounded-lg border ${
              activeTab === 'completed'
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <HStack className="items-center justify-center gap-2">
              <Text
                className={`font-medium ${
                  activeTab === 'completed' ? 'text-green-700' : 'text-gray-600'
                }`}
              >
                Completados
              </Text>
              <Badge
                variant="solid"
                action={activeTab === 'completed' ? 'success' : 'muted'}
                size="sm"
              >
                <BadgeText>{completedClients.length}</BadgeText>
              </Badge>
            </HStack>
          </Pressable>
        </HStack>

        {/* Search Bar */}
        <InputSearch
          value={currentSearch.searchInput}
          onChangeText={currentSearch.setSearchInput}
          placeholder={currentSearch.searchPlaceholder}
          onClear={currentSearch.clearSearch}
          isSheet={true}
        />
      </VStack>

      {/* Scrollable Content using BottomSheetFlatList for better performance */}
      <BottomSheetFlatList
        data={currentClients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderClientItem(item)}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 16,
          flexGrow: currentClients.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};