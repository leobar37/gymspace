import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useDataSearch } from '@/hooks/useDataSearch';
import { ClientCard } from '@/shared/components/ClientCard';
import { InputSearch } from '@/shared/input-search';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { Client } from '@gymspace/sdk';
import { UserPlusIcon, UsersIcon } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useClientsController } from '../controllers/clients.controller';

export interface ClientsListProps {
  // Selection props
  selectedClientId?: string;
  onClientSelect?: (client: Client) => void;

  // Management mode props
  onClientAction?: (client: Client) => void;

  // Filtering options
  activeOnly?: boolean;
  filterFunction?: (client: Client) => { canSelect: boolean; reason?: string };

  // UI customization
  searchPlaceholder?: string;
  emptyMessage?: string;
  showAddButton?: boolean;
  onAddClient?: () => void;

  // Check-in specific
  showCheckInStatus?: boolean;

  // Sheet mode
  isSheet?: boolean;

  // Results count message customization
  resultsMessage?: {
    single: string;
    plural: string;
    noResults: string;
  };
}

interface ClientListItemProps {
  client: Client;
  onPress: (client: Client) => void;
  onAction?: (client: Client) => void;
  canSelect?: boolean;
  selectReason?: string;
  showCheckInStatus?: boolean;
  isSheet?: boolean;
}

const ClientListItem: React.FC<ClientListItemProps> = ({
  client,
  onPress,
  onAction,
  canSelect = true,
  selectReason,
  showCheckInStatus = false,
  isSheet = false,
}) => {
  return (
    <ClientCard
      client={client}
      onPress={() => onPress(client)}
      onAction={onAction ? () => onAction(client) : undefined}
      disabled={!canSelect}
      showCheckInStatus={showCheckInStatus}
      canCheckIn={canSelect}
      checkInReason={selectReason}
      variant={isSheet ? 'complete' : 'default'}
    />
  );
};

export const ClientsListGeneric: React.FC<ClientsListProps> = ({
  selectedClientId,
  onClientSelect,
  onClientAction,
  activeOnly = false,
  filterFunction,
  searchPlaceholder = 'Buscar por nombre, email o documento...',
  emptyMessage,
  showAddButton = false,
  onAddClient,
  showCheckInStatus = false,
  isSheet = false,
  resultsMessage,
}) => {
  const { useClientsList } = useClientsController();

  const queryParams = useMemo(
    () => ({
      limit: 1000,
      page: 1,
      activeOnly,
      includeContractStatus: showCheckInStatus,
    }),
    [activeOnly, showCheckInStatus],
  );

  const { data: clientsResponse, isLoading, refetch, isRefetching } = useClientsList(queryParams);

  const clients = useMemo(() => {
    let filteredClients = clientsResponse?.data || [];

    // Apply additional filtering if provided
    if (filterFunction) {
      filteredClients = filteredClients.filter((client) => filterFunction(client).canSelect);
    }

    return filteredClients;
  }, [clientsResponse?.data, filterFunction]);

  // Local search using useDataSearch
  const { searchInput, setSearchInput, filteredData, clearSearch } = useDataSearch({
    data: clients,
    searchFields: (client) => [
      client.name || '',
      client.email || '',
      client.clientNumber || '',
      client.documentValue || '',
      client.phone || '',
    ],
    searchPlaceholder,
  });

  const displayClients = searchInput.length > 0 ? filteredData : clients;

  const handleClientPress = (client: Client) => {
    onClientSelect?.(client);
  };

  const getResultsMessage = () => {
    if (!resultsMessage) {
      const count = displayClients.length;
      if (searchInput.length > 0) {
        return `${count} cliente${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
      }
      return `${count} cliente${count !== 1 ? 's' : ''} disponible${count !== 1 ? 's' : ''}`;
    }

    const count = displayClients.length;
    if (searchInput.length > 0) {
      return count === 0
        ? resultsMessage.noResults
        : count === 1
          ? resultsMessage.single
          : resultsMessage.plural.replace('{count}', count.toString());
    }
    return count === 1
      ? resultsMessage.single
      : resultsMessage.plural.replace('{count}', count.toString());
  };

  const getEmptyMessage = () => {
    if (emptyMessage) return emptyMessage;

    if (searchInput.length > 0) {
      return 'No se encontraron clientes con esos criterios';
    }

    if (showCheckInStatus) {
      return 'No hay clientes con membresía activa disponibles para check-in';
    }

    return 'No hay clientes disponibles';
  };

  const renderClientItem = ({ item: client }: { item: Client }) => {
    const filterResult = filterFunction ? filterFunction(client) : { canSelect: true };
    return (
      <ClientListItem
        client={client}
        onPress={handleClientPress}
        onAction={onClientAction}
        canSelect={filterResult.canSelect}
        selectReason={filterResult.reason}
        showCheckInStatus={showCheckInStatus}
        isSheet={isSheet}
      />
    );
  };

  const renderItem = (client: Client) => {
    const filterResult = filterFunction ? filterFunction(client) : { canSelect: true };

    return (
      <ClientListItem
        key={client.id}
        client={client}
        onPress={handleClientPress}
        onAction={onClientAction}
        canSelect={filterResult.canSelect}
        selectReason={filterResult.reason}
        showCheckInStatus={showCheckInStatus}
        isSheet={isSheet}
      />
    );
  };

  const renderEmptyState = () => (
    <VStack className="items-center justify-center py-8">
      <Icon as={UsersIcon} className="w-12 h-12 text-gray-300 mb-4" />
      <Text className="text-gray-500 text-center mb-4">{getEmptyMessage()}</Text>
      {showAddButton && onAddClient && !searchInput.length && (
        <Button variant="outline" size="sm" onPress={onAddClient}>
          <Icon as={UserPlusIcon} className="mr-2" size="sm" />
          <ButtonText>Agregar nuevo cliente</ButtonText>
        </Button>
      )}
    </VStack>
  );

  if (isLoading) {
    return (
      <VStack className="flex-1 items-center justify-center mt-6">
        <Spinner size="large" />
        <Text className="mt-2 text-gray-600">Cargando clientes...</Text>
      </VStack>
    );
  }

  // Render for sheet mode (BottomSheetScrollView)
  if (isSheet) {
    return (
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        {displayClients.map(renderItem)}
      </BottomSheetScrollView>
    );
  }

  // Render for normal mode (FlatList with fixed search bar)
  return (
    <View className="flex-1">
      {/* Fixed Search Bar */}
      <VStack className="bg-white border-b  border-gray-200 pb-3 pt-2">
        <InputSearch
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder={searchPlaceholder}
          onClear={clearSearch}
          isSheet={isSheet}
        />

        {/* Add New Client Button */}
        {showAddButton && onAddClient && (
          <Pressable onPress={onAddClient} className="px-4 py-3 bg-white border-b border-gray-100">
            <HStack className="items-center gap-3">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                <Icon as={UserPlusIcon} className="text-blue-600" size="sm" />
              </View>
              <Text className="text-blue-600 font-medium">Agregar nuevo cliente</Text>
            </HStack>
          </Pressable>
        )}
      
      </VStack>

      {/* Scrollable List */}
      <FlatList
        data={displayClients}
        keyExtractor={(item) => item.id}
        renderItem={renderClientItem}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
        refreshControl={
          onClientAction ? (
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
});
