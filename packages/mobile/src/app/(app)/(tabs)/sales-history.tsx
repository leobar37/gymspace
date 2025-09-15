import { SaleHistoryItem } from '@/components/inventory/SaleHistoryItem';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Input, InputField } from '@/components/ui/input';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useInfiniteScroll, InfiniteScrollList } from '@/shared/pagination';
import type { Sale, SearchSalesParams } from '@gymspace/sdk';
import { router } from 'expo-router';
import {
  InfoIcon,
  ShoppingCartIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SheetManager } from 'react-native-actions-sheet';
import { Fab } from '@/components/ui/fab';

export default function SalesHistoryScreen() {
  const { sdk } = useGymSdk();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchSalesParams>({ page: 1, limit: 20 });

  // Use our new pagination hook
  const pagination = useInfiniteScroll({
    queryKey: ['sales', 'list', filters, searchTerm] as const,
    queryFn: async (params) => {
      return sdk.sales.searchSales({
        ...filters,
        ...params,
        customerName: searchTerm || undefined,
      });
    },
    limit: 20,
    enabled: true,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    prefetchNextPage: true,
  });

  const {
    allItems: sales,
    state,
    isLoading,
    error,
    isFetching,
    refresh,
  } = pagination;


  const handleFiltersChange = useCallback(
    (newFilters: SearchSalesParams) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      pagination.reset();
    },
    [pagination],
  );

  const handleSearch = useCallback(() => {
    pagination.reset();
  }, [pagination]);

  const handleOpenFilters = useCallback(() => {
    SheetManager.show('sales-filters', {
      payload: {
        currentFilters: filters,
        onApplyFilters: handleFiltersChange,
      },
    });
  }, [filters, handleFiltersChange]);

  const handleSalePress = useCallback((sale: Sale) => {
    router.push(`/inventory/sales/${sale.id}`);
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.paymentStatus) count++;
    if (filters.startDate) count++;
    if (searchTerm) count++;
    return count;
  }, [filters, searchTerm]);

  const renderSaleItem = useCallback(
    ({ item }: { item: Sale }) => (
      <SaleHistoryItem sale={item} onPress={handleSalePress} showCustomer={true} />
    ),
    [handleSalePress],
  );


  const renderEmptyState = useCallback(() => {
    const hasFilters = getActiveFiltersCount() > 0;

    // Don't show empty state while fetching
    if (isFetching && sales.length === 0) {
      return null;
    }

    return (
      <View className="flex-1 items-center justify-center py-12 px-8">
        <VStack space="lg" className="items-center">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center">
            <Icon as={ShoppingCartIcon} className="w-12 h-12 text-gray-400" />
          </View>

          <VStack space="sm" className="items-center">
            <Text className="text-xl font-semibold text-gray-900 text-center">
              {hasFilters ? 'No se encontraron ventas' : 'No hay ventas registradas'}
            </Text>
            <Text className="text-base text-gray-600 text-center px-4">
              {hasFilters
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Las ventas aparecerán aquí una vez que realices tu primera venta'}
            </Text>
          </VStack>

          {!hasFilters && (
            <Button
              variant="solid"
              size="lg"
              onPress={() => router.push('/inventory/new-sale')}
              className="mt-4"
            >
              <Icon as={ShoppingCartIcon} className="w-5 h-5 mr-2" />
              <ButtonText className="text-base">Nueva Venta</ButtonText>
            </Button>
          )}
        </VStack>
      </View>
    );
  }, [getActiveFiltersCount, isFetching, sales.length]);

  const renderLoadingState = useCallback(
    () => (
      <View className="flex-1 items-center justify-center py-12">
        <VStack space="lg" className="items-center">
          <Spinner size="large" />
          <Text className="text-lg text-gray-600">Cargando ventas...</Text>
        </VStack>
      </View>
    ),
    [],
  );

  const renderErrorState = useCallback(
    () => (
      <View className="flex-1 items-center justify-center px-8">
        <VStack space="lg" className="items-center">
          <Alert action="error" variant="solid" className="max-w-sm">
            <AlertIcon as={InfoIcon} size="lg" />
            <AlertText className="text-base">
              Error al cargar las ventas: {error?.message || 'Error desconocido'}
            </AlertText>
          </Alert>
          <Button variant="outline" size="lg" onPress={refresh}>
            <ButtonText className="text-base">Reintentar</ButtonText>
          </Button>
        </VStack>
      </View>
    ),
    [error, refresh],
  );

  // Show loading screen only on very first load
  if (isLoading && sales.length === 0 && !state.page) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <VStack className="flex-1 p-4">
          <Text className="text-2xl font-bold text-gray-900 mb-6">Historial de Ventas</Text>
          <View className="flex-1 items-center justify-center">
            <VStack space="lg" className="items-center">
              <Spinner size="large" />
              <Text className="text-lg text-gray-600">Cargando historial de ventas...</Text>
            </VStack>
          </View>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" >
      <VStack className="flex-1">
        {/* Fixed Header with Search */}
        <View className="bg-white shadow-sm border-b border-gray-100">
          <VStack className="p-4" space="lg">
            {/* Search Bar and Filters */}
            <HStack space="md" className="items-center">
              <View className="flex-1">
                <Input size="lg" className="bg-gray-50 border-gray-200">
                  <InputField
                    placeholder="Buscar por cliente..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    className="text-base"
                  />
                </Input>
              </View>

              <Button
                variant="outline"
                size="md"
                onPress={handleSearch}
                className="border-gray-300 px-4"
              >
                <Icon as={SearchIcon} className="w-5 h-5 text-gray-600" />
              </Button>

              <Button
                variant="outline"
                size="md"
                onPress={handleOpenFilters}
                className={`border-gray-300 px-4 ${getActiveFiltersCount() > 0 ? 'bg-blue-50 border-blue-300' : ''}`}
              >
                <HStack space="xs" className="items-center">
                  <Icon
                    as={FilterIcon}
                    className={`w-5 h-5 ${getActiveFiltersCount() > 0 ? 'text-blue-600' : 'text-gray-600'}`}
                  />
                  {getActiveFiltersCount() > 0 && (
                    <View className="bg-blue-600 rounded-full px-1.5 py-0.5 min-w-[20px]">
                      <Text className="text-xs text-white font-bold text-center">
                        {getActiveFiltersCount()}
                      </Text>
                    </View>
                  )}
                </HStack>
              </Button>
            </HStack>
          </VStack>
        </View>

        {/* Sales List with Infinite Scroll */}
        <InfiniteScrollList
          pagination={pagination}
          renderItem={renderSaleItem}
          ListHeaderComponent={null}
          loadingComponent={renderLoadingState()}
          emptyComponent={renderEmptyState()}
          errorComponent={renderErrorState()}
          enableRefresh={true}
          onEndReachedThreshold={0.3}
          performanceConfig={{
            maxToRenderPerBatch: 10,
            windowSize: 10,
            initialNumToRender: 8,
            removeClippedSubviews: true,
          }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 20,
          }}
          ItemSeparatorComponent={() => <View className="h-2" />}
        />

        {/* Floating Action Button for New Sale */}
        <Fab
          onPress={() => router.push('/inventory/new-sale')}
          placement="bottom right"
          size="lg"
          renderInPortal={false}
        >
          <Icon as={PlusIcon} className="text-white" />
        </Fab>
      </VStack>
    </View>
  );
}
