import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useDataSearch } from '@/hooks/useDataSearch';
import { InputSearch } from '@/shared/input-search';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { PaymentMethod } from '@gymspace/sdk';
import { CreditCardIcon, PlusIcon } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { usePaymentMethodsController } from '../controllers/payment-methods.controller';
import { getPaymentMethodIcon, getPaymentMethodColor } from '../utils/payment-method-helpers';
import { Badge, BadgeText } from '@/components/ui/badge';

export interface PaymentMethodsListProps {
  // Selection props
  selectedPaymentMethodId?: string;
  onPaymentMethodSelect?: (paymentMethod: PaymentMethod) => void;

  // Management mode props
  onPaymentMethodAction?: (paymentMethod: PaymentMethod) => void;

  // Filtering options
  activeOnly?: boolean;
  filterFunction?: (paymentMethod: PaymentMethod) => { canSelect: boolean; reason?: string };

  // UI customization
  searchPlaceholder?: string;
  emptyMessage?: string;
  showAddButton?: boolean;
  onAddPaymentMethod?: () => void;

  // Sheet mode
  isSheet?: boolean;

  // Results count message customization
  resultsMessage?: {
    single: string;
    plural: string;
    noResults: string;
  };
}

interface PaymentMethodListItemProps {
  paymentMethod: PaymentMethod;
  onPress: (paymentMethod: PaymentMethod) => void;
  onAction?: (paymentMethod: PaymentMethod) => void;
  canSelect?: boolean;
  selectReason?: string;
  isSelected?: boolean;
  isSheet?: boolean;
}

const PaymentMethodListItem: React.FC<PaymentMethodListItemProps> = ({
  paymentMethod,
  onPress,
  onAction,
  canSelect = true,
  selectReason,
  isSelected = false,
  isSheet = false,
}) => {
  const IconComponent = getPaymentMethodIcon(paymentMethod);
  const colorClass = getPaymentMethodColor(paymentMethod.code);
  const bgColor = colorClass.split(' ')[0];
  const textColor = colorClass.split(' ')[1];

  return (
    <Pressable
      onPress={() => canSelect && onPress(paymentMethod)}
      disabled={!canSelect}
      className={`
        p-4 rounded-lg border mb-3
        ${isSelected ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}
        ${!canSelect ? 'opacity-60' : ''}
      `}
    >
      <HStack className="items-center gap-3">
        <View className={`w-10 h-10 p-2 rounded-full items-center justify-center ${bgColor}`}>
          <Icon as={IconComponent} className={textColor} size="sm" />
        </View>

        <VStack className="flex-1">
          <HStack className="items-center justify-between">
            <VStack className="flex-1">
              <Text
                className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}
              >
                {paymentMethod.name}
              </Text>
              <Text
                className={`text-sm font-mono ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}
              >
                {paymentMethod.code}
              </Text>
              {paymentMethod.description && (
                <Text
                  className={`text-sm ${isSelected ? 'text-blue-600' : 'text-gray-500'} mt-1`}
                >
                  {paymentMethod.description}
                </Text>
              )}
              {!canSelect && selectReason && (
                <Text className="text-xs text-red-500 mt-1">{selectReason}</Text>
              )}
            </VStack>

            <VStack className="items-end gap-1">
              <HStack className="items-center gap-2">
                <Badge variant="solid" action={paymentMethod.enabled ? 'success' : 'muted'} size="sm">
                  <BadgeText>{paymentMethod.enabled ? 'Activo' : 'Inactivo'}</BadgeText>
                </Badge>
                {isSelected && (
                  <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-white text-xs">✓</Text>
                  </View>
                )}
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </HStack>
    </Pressable>
  );
};

export const PaymentMethodsListGeneric: React.FC<PaymentMethodsListProps> = ({
  selectedPaymentMethodId,
  onPaymentMethodSelect,
  onPaymentMethodAction,
  activeOnly = false,
  filterFunction,
  searchPlaceholder = 'Buscar por nombre o código...',
  emptyMessage,
  showAddButton = false,
  onAddPaymentMethod,
  isSheet = false,
  resultsMessage,
}) => {
  const { usePaymentMethodsList } = usePaymentMethodsController();

  const queryParams = useMemo(
    () => ({
      limit: 1000,
      page: 1,
      enabledOnly: activeOnly,
    }),
    [activeOnly],
  );

  const { data: paymentMethodsResponse, isLoading, refetch, isRefetching } = usePaymentMethodsList(queryParams);

  const paymentMethods = useMemo(() => {
    let filteredPaymentMethods = paymentMethodsResponse?.data || [];

    // Apply additional filtering if provided
    if (filterFunction) {
      filteredPaymentMethods = filteredPaymentMethods.filter((pm) => filterFunction(pm).canSelect);
    }

    return filteredPaymentMethods;
  }, [paymentMethodsResponse?.data, filterFunction]);

  // Local search using useDataSearch
  const { searchInput, setSearchInput, filteredData, clearSearch } = useDataSearch({
    data: paymentMethods,
    searchFields: (paymentMethod) => [
      paymentMethod.name || '',
      paymentMethod.code || '',
      paymentMethod.description || '',
    ],
    searchPlaceholder,
  });

  const displayPaymentMethods = searchInput.length > 0 ? filteredData : paymentMethods;

  const handlePaymentMethodPress = (paymentMethod: PaymentMethod) => {
    onPaymentMethodSelect?.(paymentMethod);
  };

  const getResultsMessage = () => {
    if (!resultsMessage) {
      const count = displayPaymentMethods.length;
      if (searchInput.length > 0) {
        return `${count} método${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
      }
      return `${count} método${count !== 1 ? 's' : ''} disponible${count !== 1 ? 's' : ''}`;
    }

    const count = displayPaymentMethods.length;
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
      return 'No se encontraron métodos de pago con esos criterios';
    }

    return 'No hay métodos de pago disponibles';
  };

  const renderPaymentMethodItem = ({ item: paymentMethod }: { item: PaymentMethod }) => {
    const filterResult = filterFunction ? filterFunction(paymentMethod) : { canSelect: true };
    return (
      <PaymentMethodListItem
        paymentMethod={paymentMethod}
        onPress={handlePaymentMethodPress}
        onAction={onPaymentMethodAction}
        canSelect={filterResult.canSelect}
        selectReason={filterResult.reason}
        isSelected={selectedPaymentMethodId === paymentMethod.id}
        isSheet={isSheet}
      />
    );
  };

  const renderItem = (paymentMethod: PaymentMethod) => {
    const filterResult = filterFunction ? filterFunction(paymentMethod) : { canSelect: true };

    return (
      <PaymentMethodListItem
        key={paymentMethod.id}
        paymentMethod={paymentMethod}
        onPress={handlePaymentMethodPress}
        onAction={onPaymentMethodAction}
        canSelect={filterResult.canSelect}
        selectReason={filterResult.reason}
        isSelected={selectedPaymentMethodId === paymentMethod.id}
        isSheet={isSheet}
      />
    );
  };

  const renderEmptyState = () => (
    <VStack className="items-center justify-center py-8">
      <Icon as={CreditCardIcon} className="w-12 h-12 text-gray-300 mb-4" />
      <Text className="text-gray-500 text-center mb-4">{getEmptyMessage()}</Text>
      {showAddButton && onAddPaymentMethod && !searchInput.length && (
        <Button variant="outline" size="sm" onPress={onAddPaymentMethod}>
          <Icon as={PlusIcon} className="mr-2" size="sm" />
          <ButtonText>Agregar nuevo método</ButtonText>
        </Button>
      )}
    </VStack>
  );

  if (isLoading) {
    return (
      <VStack className="flex-1 items-center justify-center mt-6">
        <Spinner size="large" />
        <Text className="mt-2 text-gray-600">Cargando métodos de pago...</Text>
      </VStack>
    );
  }

  // Render for sheet mode (BottomSheetScrollView)
  if (isSheet) {
    return (
      <View className="flex-1">
        {/* Fixed Search Bar */}
        <VStack className="bg-white border-b border-gray-200 px-4 pb-3 pt-2">
          <InputSearch
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={searchPlaceholder}
            onClear={clearSearch}
            isSheet={isSheet}
          />
        </VStack>

        {/* Add New Payment Method Button */}
        {showAddButton && onAddPaymentMethod && (
          <Pressable onPress={onAddPaymentMethod} className="px-4 py-3 bg-white border-b border-gray-100">
            <HStack className="items-center gap-3">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                <Icon as={PlusIcon} className="text-blue-600" size="sm" />
              </View>
              <Text className="text-blue-600 font-medium">Agregar nuevo método de pago</Text>
            </HStack>
          </Pressable>
        )}

        {/* Scrollable Content */}
        <BottomSheetScrollView 
          contentContainerClassName="flex-grow px-4 pt-2 pb-4"
          showsVerticalScrollIndicator={false}
        >
          {displayPaymentMethods.length > 0 ? (
            displayPaymentMethods.map(renderItem)
          ) : (
            renderEmptyState()
          )}
        </BottomSheetScrollView>
      </View>
    );
  }

  // Render for normal mode (FlatList with fixed search bar)
  return (
    <View className="flex-1">
      {/* Fixed Search Bar */}
      <VStack className="bg-white border-b border-gray-200 pb-3 pt-2">
        <InputSearch
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder={searchPlaceholder}
          onClear={clearSearch}
          isSheet={isSheet}
        />

        {/* Add New Payment Method Button */}
        {showAddButton && onAddPaymentMethod && (
          <Pressable onPress={onAddPaymentMethod} className="px-4 py-3 bg-white border-b border-gray-100">
            <HStack className="items-center gap-3">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                <Icon as={PlusIcon} className="text-blue-600" size="sm" />
              </View>
              <Text className="text-blue-600 font-medium">Agregar nuevo método de pago</Text>
            </HStack>
          </Pressable>
        )}
      
      </VStack>

      {/* Scrollable List */}
      <FlatList
        data={displayPaymentMethods}
        keyExtractor={(item) => item.id}
        renderItem={renderPaymentMethodItem}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
        refreshControl={
          onPaymentMethodAction ? (
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pt-2"
      />
    </View>
  );
};