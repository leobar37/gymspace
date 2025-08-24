import React, { useState } from 'react';
import { FlatList, RefreshControl, View, Pressable } from 'react-native';
import { usePaymentMethodsController } from '../controllers/payment-methods.controller';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
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
import {
  SearchIcon,
  PlusIcon,
  CreditCardIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useDebounce } from '@/hooks/useDebounce';
import type { PaymentMethod } from '@gymspace/sdk';

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onPress: () => void;
  onActionPress: (paymentMethod: PaymentMethod) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ 
  paymentMethod, 
  onPress, 
  onActionPress 
}) => {
  return (
    <Card className="mb-3 p-4">
      <HStack className="items-center justify-between">
        <Pressable onPress={onPress} className="flex-1">
          <HStack className="items-center gap-3 flex-1">
            <View className="bg-blue-100 p-3 rounded-full">
              <Icon as={CreditCardIcon} className="text-blue-600" size="lg" />
            </View>

            <VStack className="flex-1">
              <Text className="font-semibold text-gray-900">{paymentMethod.name}</Text>
              <Text className="text-sm text-gray-600 font-mono">{paymentMethod.code}</Text>
              {paymentMethod.description && (
                <Text className="text-sm text-gray-500 mt-1">
                  {paymentMethod.description}
                </Text>
              )}
            </VStack>
          </HStack>
        </Pressable>

        <VStack className="items-end gap-1">
          <HStack className="items-center gap-2">
            <Badge variant="solid" action={paymentMethod.enabled ? 'success' : 'muted'}>
              <BadgeText>{paymentMethod.enabled ? 'Activo' : 'Inactivo'}</BadgeText>
            </Badge>
            <Pressable onPress={() => onActionPress(paymentMethod)} className="p-1">
              <Icon as={MoreHorizontalIcon} />
            </Pressable>
          </HStack>
        </VStack>
      </HStack>
    </Card>
  );
};

export const PaymentMethodsList: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<PaymentMethod | null>(null);
  const debouncedSearch = useDebounce(searchText, 300);

  const { usePaymentMethodsList, toggleStatus, isTogglingStatus, deletePaymentMethod, isDeletingPaymentMethod } = usePaymentMethodsController();
  const { data, isLoading, refetch, isRefetching } = usePaymentMethodsList({
    search: debouncedSearch,
    enabledOnly: false,
  });

  const handlePaymentMethodPress = (paymentMethodId: string) => {
    // For now, just show action sheet since we don't have detail view
    const paymentMethod = data?.data.find(pm => pm.id === paymentMethodId);
    if (paymentMethod) {
      setSelectedPaymentMethod(paymentMethod);
      setShowActionsheet(true);
    }
  };

  const handleAddPaymentMethod = () => {
    // TODO: Navigate to create payment method when the route is created
    console.log('Add payment method - route not implemented yet');
  };

  const handleActionPress = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setShowActionsheet(true);
  };

  const handleEditPaymentMethod = () => {
    setShowActionsheet(false);
    // TODO: Navigate to edit payment method when route is created
    if (selectedPaymentMethod) {
      console.log('Edit payment method - route not implemented yet', selectedPaymentMethod.id);
    }
  };

  const handleToggleStatusPress = () => {
    setShowActionsheet(false);
    if (selectedPaymentMethod) {
      toggleStatus(selectedPaymentMethod.id);
    }
  };

  const handleDeletePress = () => {
    setShowActionsheet(false);
    setPaymentMethodToDelete(selectedPaymentMethod);
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = () => {
    if (paymentMethodToDelete) {
      deletePaymentMethod(paymentMethodToDelete.id);
      setShowDeleteAlert(false);
      setPaymentMethodToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteAlert(false);
    setPaymentMethodToDelete(null);
  };

  const renderEmptyState = () => (
    <VStack className="flex-1 items-center justify-center p-8">
      <Text className="text-gray-500 text-center mb-4">
        {searchText ? 'No se encontraron métodos de pago' : 'No hay métodos de pago registrados'}
      </Text>
      {!searchText && (
        <Button onPress={handleAddPaymentMethod}>
          <Icon as={PlusIcon} className="text-white mr-2" />
          <ButtonText>Agregar primer método</ButtonText>
        </Button>
      )}
    </VStack>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <HStack className="items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900">Métodos de Pago</Text>
        </HStack>

        {/* Search bar */}
        <Input className="bg-gray-50">
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} className="text-gray-400" />
          </InputSlot>
          <InputField
            placeholder="Buscar por nombre o código..."
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
        </Input>
      </View>

      {/* Payment methods list */}
      {isLoading ? (
        <VStack className="flex-1 items-center justify-center">
          <Spinner className="text-blue-600" />
          <Text className="text-gray-600 mt-2">Cargando métodos de pago...</Text>
        </VStack>
      ) : (
        <FlatList
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PaymentMethodCard
              paymentMethod={item}
              onPress={() => handlePaymentMethodPress(item.id)}
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

      {/* FAB for adding payment method */}
      {data?.data && data.data.length > 0 && (
        <View className="absolute bottom-6 right-6">
          <Button onPress={handleAddPaymentMethod} action="primary">
            <Icon className="text-white" as={PlusIcon} />
          </Button>
        </View>
      )}

      {/* Action Sheet */}
      <Actionsheet
        isOpen={showActionsheet}
        onClose={() => setShowActionsheet(false)}
        snapPoints={[40]}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <ActionsheetItem onPress={handleEditPaymentMethod}>
            <Icon as={EditIcon} />
            <ActionsheetItemText>Editar</ActionsheetItemText>
          </ActionsheetItem>

          <ActionsheetItem onPress={handleToggleStatusPress}>
            <Icon as={selectedPaymentMethod?.enabled ? TrashIcon : CreditCardIcon} />
            <ActionsheetItemText>
              {selectedPaymentMethod?.enabled ? 'Desactivar' : 'Activar'}
            </ActionsheetItemText>
          </ActionsheetItem>

          <ActionsheetItem onPress={handleDeletePress}>
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
            <Text className="text-lg font-semibold">Eliminar Método de Pago</Text>
            <AlertDialogCloseButton onPress={handleCancelDelete} />
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className="text-gray-600">
              ¿Estás seguro de que deseas eliminar el método de pago "{paymentMethodToDelete?.name}"?
            </Text>
            <Text className="text-sm text-gray-500 mt-2">
              Esta acción no se puede deshacer.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="outline" onPress={handleCancelDelete}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              action="negative"
              onPress={handleConfirmDelete}
              disabled={isDeletingPaymentMethod}
            >
              <ButtonText>Eliminar</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
};