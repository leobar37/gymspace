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
import { Button, ButtonText } from '@/components/ui/button';
import { Fab } from '@/components/ui/fab';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import {
  EditIcon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { useClientsController } from '../controllers/clients.controller';
import { ClientsListGeneric } from './ClientsList.generic';
import type { Client } from '@gymspace/sdk';

const ClientsListComponent: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const { navigateWithinFeature } = useSafeNavigation();
  const { toggleStatus, isTogglingStatus } = useClientsController();

  const handleClientPress = (client: Client) => {
    navigateWithinFeature(`/clients/${client.id}`);
  };

  const handleAddClient = () => {
    navigateWithinFeature('/clients/create');
  };

  // Handle actions menu
  const handleClientAction = (client: Client) => {
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

  return (
    <View className="flex-1 bg-gray-50">
      <ClientsListGeneric
        onClientSelect={handleClientPress}
        onClientAction={handleClientAction}
        activeOnly={false}
        searchPlaceholder="Buscar..."
        showAddButton={false} // We'll use FAB instead
        isSheet={false}
        emptyMessage="No hay clientes registrados"
      />

      {/* FAB for adding client - positioned absolutely */}
      <Fab
        size="md"
        placement="bottom right"
        onPress={handleAddClient}
      >
        <Icon as={PlusIcon} />
      </Fab>

      {/* Action Sheet */}
      <Actionsheet
        isOpen={showActionsheet}
        onClose={() => setShowActionsheet(false)}
        snapPoints={[30]}
      >
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
