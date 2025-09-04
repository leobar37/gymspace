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
import { Badge, BadgeText } from '@/components/ui/badge';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useDebounce } from '@/hooks/useDebounce';
import type { PaymentMethod } from '@gymspace/sdk';
import {
  CreditCardIcon,
  EditIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from 'lucide-react-native';
import React, { Fragment, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { usePaymentMethodsController } from '../controllers/payment-methods.controller';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { Fab, FabIcon } from '@/components/ui/fab';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onPress: () => void;
  onActionPress: (paymentMethod: PaymentMethod) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  paymentMethod,
  onPress,
  onActionPress,
}) => {
  return (
    <Card className="mb-3 p-4">
      <HStack className="items-center justify-between">
        <Pressable onPress={onPress} className="flex-1">
          <HStack className="items-center gap-3 flex-1">
            <View className="bg-primary-50 p-3 rounded-full">
              <Icon as={CreditCardIcon} className="text-primary-600" size="md" />
            </View>

            <VStack className="flex-1">
              <Text className="font-semibold text-gray-900">{paymentMethod.name}</Text>
              <Text className="text-sm text-gray-600 font-mono">{paymentMethod.code}</Text>
              {paymentMethod.description && (
                <Text className="text-sm text-gray-500 mt-1">{paymentMethod.description}</Text>
              )}
            </VStack>
          </HStack>
        </Pressable>

        <VStack className="items-end gap-1">
          <HStack className="items-center gap-2">
            <Badge variant="solid" action={paymentMethod.enabled ? 'success' : 'muted'} size="sm">
              <BadgeText>{paymentMethod.enabled ? 'Activo' : 'Inactivo'}</BadgeText>
            </Badge>
            <Pressable onPress={() => onActionPress(paymentMethod)} className="p-2">
              <Icon as={MoreHorizontalIcon} size="sm" className="text-gray-500" />
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
  const [showPaymentMethodSelector, setShowPaymentMethodSelector] = useState(false);
  const debouncedSearch = useDebounce(searchText, 300);

  const { usePaymentMethodsList, toggleStatus, deletePaymentMethod, isDeletingPaymentMethod } =
    usePaymentMethodsController();
  const { data, isLoading, refetch, isRefetching } = usePaymentMethodsList({
    search: debouncedSearch,
    enabledOnly: false,
    page: 1,
    limit: 50,
  });

  const handlePaymentMethodPress = (paymentMethodId: string) => {
    // Navigate to detail view
    router.push(`/payment-methods/${paymentMethodId}`);
  };

  const handleAddPaymentMethod = () => {
    setShowPaymentMethodSelector(true);
  };

  const handleSelectPaymentMethod = (paymentMethod: any) => {
    setShowPaymentMethodSelector(false);
    // Navigate to create payment method screen with selected type
    router.push({
      pathname: '/payment-methods/create',
      params: {
        type: paymentMethod.code,
        name: paymentMethod.name,
        description: paymentMethod.description,
        metadata: JSON.stringify(paymentMethod.metadata),
      },
    });
  };

  const handleActionPress = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setShowActionsheet(true);
  };

  const handleEditPaymentMethod = () => {
    setShowActionsheet(false);
    if (selectedPaymentMethod) {
      router.push(`/payment-methods/${selectedPaymentMethod.id}/edit`);
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
        <Button onPress={handleAddPaymentMethod} variant="solid">
          <ButtonText>Agregar primer método</ButtonText>
        </Button>
      )}
    </VStack>
  );

  return (
    <SafeAreaView className='h-full'>
      {/* Header */}
      <View className="bg-white border-b border-gray-200">
        {/* Search bar */}
        <View className="px-4 pb-3 pt-2">
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
      </View>

      {/* Payment methods list */}
      {isLoading ? (
        <VStack className="flex-1 items-center justify-center">
          <Spinner size="large" />
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
              ¿Estás seguro de que deseas eliminar el método de pago "{paymentMethodToDelete?.name}
              "?
            </Text>
            <Text className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</Text>
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

      {/* FAB for adding payment method */}

      {/* Payment Method Selector Drawer */}
      <PaymentMethodSelector
        isOpen={showPaymentMethodSelector}
        onClose={() => setShowPaymentMethodSelector(false)}
        onSelectPaymentMethod={handleSelectPaymentMethod}
      />
      {data?.data && data.data.length > 0 && (
        <Fab size="md" placement="bottom right" onPress={handleAddPaymentMethod}>
          <FabIcon as={PlusIcon} />
        </Fab>
      )}
    </SafeAreaView>
  );
};
