import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from '@/components/ui/actionsheet';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Avatar } from '@/components/ui/avatar';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useDataSearch } from '@/hooks/useDataSearch';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { InputSearch } from '@/shared/input-search';
import {
  EditIcon,
  MoreHorizontalIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useClientsController } from '../controllers/clients.controller';

interface ClientCardProps {
  client: any;
  onPress: () => void;
  onActionPress: (client: any) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onPress, onActionPress }) => {
  const hasActiveContract = client.contracts?.length > 0;
  // Nuevo flag derivado del status
  const isActive = client.status === 'active';

  return (
    <Card className="p-4">
      <HStack className="items-center justify-between">
        <Pressable onPress={onPress} className="flex-1">
          <HStack className="items-center gap-3 flex-1">
            <Avatar className="bg-blue-600">
              <Text className="text-white font-semibold">
                {client.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')}
              </Text>
            </Avatar>

            <VStack className="flex-1">
              <Text className="font-semibold text-gray-900">{client.name}</Text>
              {client.phone && (
                <HStack className="items-center gap-1 mt-1">
                  <Icon as={PhoneIcon} className='text-gray-500' />
                  <Text className="text-sm text-gray-500">{client.phone}</Text>
                </HStack>
              )}
            </VStack>
          </HStack>
        </Pressable>
        <VStack className="items-end gap-1">
          <HStack className="items-center gap-2">
            <Badge variant="solid" action={isActive ? 'success' : 'muted'}>
              <BadgeText>{isActive ? 'Activo' : 'Inactivo'}</BadgeText>
            </Badge>
            <Pressable onPress={() => onActionPress(client)} className="p-1">
              <Icon as={MoreHorizontalIcon} />
            </Pressable>
          </HStack>
          {hasActiveContract && (
            <Badge variant="outline" action="info">
              <BadgeText className="text-xs">Plan activo</BadgeText>
            </Badge>
          )}
        </VStack>
      </HStack>
    </Card>
  );
};

const ClientsListComponent: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any>(null);

  const { navigateWithinFeature } = useSafeNavigation();
  const { useClientsList, toggleStatus, isTogglingStatus } = useClientsController();

  // Fetch first 1000 clients for local filtering
  const { data, isLoading, refetch, isRefetching } = useClientsList({
    search: '',
    activeOnly: false,
    page: 0,
    limit: 1000,
    sortBy: 'createdAt',
  });

  // Use local search hook
  const { searchInput, setSearchInput, filteredData, hasSearch } = useDataSearch({
    data: data?.data || [],
    searchFields: (client) => [
      client.name || '',
      client.email || '',
      client.phone || '',
      client.clientNumber || '',
    ],
    searchPlaceholder: 'Buscar ...',
  });

  const handleClientPress = (clientId: string) => {
    navigateWithinFeature(`/clients/${clientId}`);
  };

  const handleAddClient = () => {
    navigateWithinFeature('/clients/create');
  };

  const handleActionPress = (client: any) => {
    setSelectedClient(client);
    setShowActionsheet(true);
  };

  const handleEditClient = () => {
    setShowActionsheet(false);
    if (selectedClient) {
      navigateWithinFeature(`/clients/${selectedClient.id}/edit`);
    }
  };

  const handleToggleStatusPress = () => {
    setShowActionsheet(false);
    setClientToDelete(selectedClient);
    setShowDeleteAlert(true);
  };

  const handleConfirmToggleStatus = () => {
    if (clientToDelete) {
      toggleStatus(clientToDelete.id);
      setShowDeleteAlert(false);
      setClientToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteAlert(false);
    setClientToDelete(null);
  };

  const renderEmptyState = () => (
    <VStack className="flex-1 items-center justify-center p-8">
      <Text className="text-gray-500 text-center mb-4">
        {hasSearch ? 'No se encontraron clientes' : 'No hay clientes registrados'}
      </Text>
      {!hasSearch && (
        <Button onPress={handleAddClient}>
          <Icon as={UserPlusIcon} className="text-white mr-2" />
          <ButtonText>Agregar primer cliente</ButtonText>
        </Button>
      )}
    </VStack>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search bar */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <InputSearch
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Buscar..."
        />
      </View>

      {/* Clients list */}
      {isLoading ? (
        <VStack className="flex-1 items-center justify-center">
          <Spinner className="text-blue-600" />
          <Text className="text-gray-600 mt-2">Cargando clientes...</Text>
        </VStack>
      ) : (
        <FlatList
          data={filteredData}
          className='-mt-3'
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClientCard
              client={item}
              onPress={() => handleClientPress(item.id)}
              onActionPress={handleActionPress}
            />
          )}
          contentContainerStyle={{
            padding: 16,
            flexGrow: 1,
          }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* FAB for adding client */}
      {filteredData.length > 0 && (
        <Fab
          size="md"
          placement="bottom right"
          onPress={handleAddClient}
        >
          <Icon as={PlusIcon}  />
        </Fab>
      )}

      {/* Action Sheet */}
      <Actionsheet
        isOpen={showActionsheet}
        onClose={() => setShowActionsheet(false)}
        snapPoints={[30]}
      > modelo
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <ActionsheetItem onPress={handleEditClient}>
            <Icon as={EditIcon} />
            <ActionsheetItemText>Editar</ActionsheetItemText>
          </ActionsheetItem>

          <ActionsheetItem onPress={handleToggleStatusPress}>
            <Icon as={TrashIcon} />
            <ActionsheetItemText>Eliminar</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>

      {/* Delete Confirmation Alert */}
      <AlertDialog isOpen={showDeleteAlert} onClose={handleCancelDelete}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Text className="text-lg font-semibold">Eliminar Cliente</Text>
            <AlertDialogCloseButton onPress={handleCancelDelete} />
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className="text-gray-600">
              ¿Estás seguro de que deseas eliminar a {clientToDelete?.name}?
            </Text>
            <Text className="text-sm text-gray-500 mt-2">
              Nota: El cliente será desactivado y no podrá acceder al gimnasio, pero su historial se
              mantendrá.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="outline" onPress={handleCancelDelete}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              action="negative"
              onPress={handleConfirmToggleStatus}
              disabled={isTogglingStatus}
            >
              <ButtonText>Eliminar</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
};

export const ClientsList = React.memo(ClientsListComponent);
