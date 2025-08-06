import React, { useState } from 'react';
import { FlatList, RefreshControl, View, Pressable } from 'react-native';
import { useClientsController } from '../controllers/clients.controller';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputSlot, InputIcon } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogFooter,
  AlertDialogBody,
} from '@/components/ui/alert-dialog';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from '@/components/ui/actionsheet';
import { SearchIcon, UserPlusIcon, PhoneIcon, MoreHorizontalIcon, EditIcon, TrashIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { useDebounce } from '@/hooks/useDebounce';

interface ClientCardProps {
  client: any;
  onPress: () => void;
  onActionPress: (client: any) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onPress, onActionPress }) => {
  const hasActiveContract = client.contracts?.length > 0;
  
  return (
    <Card className="mb-3 p-4">
      <HStack className="items-center justify-between">
        <Pressable onPress={onPress} className="flex-1">
          <HStack className="items-center gap-3 flex-1">
            <Avatar className="bg-blue-600">
              <Text className="text-white font-semibold">
                {client.name.split(' ').map((n: string) => n[0]).join('')}
              </Text>
            </Avatar>
            
            <VStack className="flex-1">
              <Text className="font-semibold text-gray-900">{client.name}</Text>
              <Text className="text-sm text-gray-600">{client.clientNumber}</Text>
              {client.phone && (
                <HStack className="items-center gap-1 mt-1">
                  <Icon as={PhoneIcon} />
                  <Text className="text-sm text-gray-500">{client.phone}</Text>
                </HStack>
              )}
            </VStack>
          </HStack>
        </Pressable>
        
        <VStack className="items-end gap-1">
          <HStack className="items-center gap-2">
            <Badge
              variant="solid"
              action={client.isActive ? 'success' : 'muted'}
            >
              <BadgeText>{client.isActive ? 'Activo' : 'Inactivo'}</BadgeText>
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

export const ClientsList: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any>(null);
  const debouncedSearch = useDebounce(searchText, 300);
  
  const { useClientsList, toggleStatus, isTogglingStatus } = useClientsController();
  const { data, isLoading, refetch, isRefetching } = useClientsList({
    search: debouncedSearch,
    activeOnly: false,
  });

  const handleClientPress = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  const handleAddClient = () => {
    router.push('/clients/create');
  };

  const handleActionPress = (client: any) => {
    setSelectedClient(client);
    setShowActionsheet(true);
  };

  const handleEditClient = () => {
    setShowActionsheet(false);
    if (selectedClient) {
      router.push(`/clients/${selectedClient.id}/edit`);
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
        {searchText ? 'No se encontraron clientes' : 'No hay clientes registrados'}
      </Text>
      {!searchText && (
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
        <Input className="bg-gray-50">
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} className="text-gray-400" />
          </InputSlot>
          <InputField
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
        </Input>
      </View>

      {/* Clients list */}
      {isLoading ? (
        <VStack className="flex-1 items-center justify-center">
          <Spinner className="text-blue-600" />
          <Text className="text-gray-600 mt-2">Cargando clientes...</Text>
        </VStack>
      ) : (
        <FlatList
          data={data?.data || []}
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
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* FAB for adding client */}
      {data?.data && data.data.length > 0 && (
        <View className="absolute bottom-6 right-6">
          <Button
            onPress={handleAddClient}
            action="primary"
          >
            <Icon className='text-white' as={UserPlusIcon} />
          </Button>
        </View>
      )}

      {/* Action Sheet */}
      <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)} snapPoints={[30]}>
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
            <ActionsheetItemText>
              Eliminar
            </ActionsheetItemText>
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
              Nota: El cliente será desactivado y no podrá acceder al gimnasio, pero su historial se mantendrá.
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
              <ButtonText>
                Eliminar
              </ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
};