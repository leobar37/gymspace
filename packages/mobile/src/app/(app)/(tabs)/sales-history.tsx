import { SaleHistoryItem } from '@/components/inventory/SaleHistoryItem';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { SalesSearchAndFilters } from '@/components/inventory/SalesSearchAndFilters';
import { useGymSdk } from '@/providers/GymSdkProvider';
import type { Sale, SearchSalesParams, PaginatedResponseDto } from '@gymspace/sdk';
import { router } from 'expo-router';
import { InfoIcon, ShoppingCartIcon, PlusIcon } from 'lucide-react-native';
import React, { useCallback, useState, useMemo } from 'react';
import { FlatList, RefreshControl, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fab } from '@/components/ui/fab';
import { useInfiniteQuery } from '@tanstack/react-query';

export default function SalesHistoryScreen() {
  const { sdk } = useGymSdk();
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchSalesParams>({ page: 1, limit: 20 });

  // Use TanStack Query's useInfiniteQuery
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<PaginatedResponseDto<Sale>>({
    queryKey: ['sales', 'list', filters, activeSearchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      return sdk.sales.searchSales({
        ...filters,
        page: pageParam as number,
        limit: 20,
        customerName: activeSearchTerm || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasNext) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Flatten all pages into a single array of sales
  const sales = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const handleFiltersChange = useCallback(
    (newFilters: SearchSalesParams) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [],
  );

  const handleSearch = useCallback((term: string) => {
    setActiveSearchTerm(term);
  }, []);

  const handleSearchTermChange = useCallback((_term: string) => {
    // This is just for updating the local state in the search component
    // The actual search happens when handleSearch is called
  }, []);

  const handleSalePress = useCallback((sale: Sale) => {
    router.push(`/inventory/sales/${sale.id}`);
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.paymentStatus) count++;
    if (filters.startDate) count++;
    if (activeSearchTerm) count++;
    return count;
  }, [filters, activeSearchTerm]);

  const renderSaleItem: ListRenderItem<Sale> = useCallback(
    ({ item }) => (
      <SaleHistoryItem sale={item} onPress={handleSalePress} showCustomer={true} />
    ),
    [handleSalePress],
  );

  const renderEmptyState = useCallback(() => {
    const hasFilters = getActiveFiltersCount() > 0;

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
              onPress={() => router.push('/inventory/new-sale/')}
              className="mt-4"
            >
              <Icon as={ShoppingCartIcon} className="w-5 h-5 mr-2" />
              <ButtonText className="text-base">Nueva Venta</ButtonText>
            </Button>
          )}
        </VStack>
      </View>
    );
  }, [getActiveFiltersCount]);

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
          <Button variant="outline" size="lg" onPress={() => refetch()}>
            <ButtonText className="text-base">Reintentar</ButtonText>
          </Button>
        </VStack>
      </View>
    ),
    [error, refetch],
  );

  // Show loading screen only on very first load
  if (isLoading && sales.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <VStack className="flex-1 p-4">
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
    <View className="flex-1 bg-gray-50">
      <VStack className="flex-1">
        {/* Search and Filters Component */}
        <SalesSearchAndFilters
          searchTerm={activeSearchTerm}
          onSearchTermChange={handleSearchTermChange}
          onSearch={handleSearch}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          activeFiltersCount={getActiveFiltersCount()}
        />

        {/* Sales List with Native FlatList */}
        <FlatList
          data={sales}
          renderItem={renderSaleItem}
          keyExtractor={(item) => item.id}
          className='px-2'
          contentContainerStyle={{
            flexGrow: sales.length === 0 ? 1 : undefined,
            paddingBottom: 80, // Space for FAB
          }}
          ListEmptyComponent={
            isLoading ? renderLoadingState() : error ? renderErrorState() : renderEmptyState()
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <HStack space="sm" className="items-center">
                  <Spinner size="small" />
                  <Text className="text-gray-600 text-sm">Cargando más...</Text>
                </HStack>
              </View>
            ) : hasNextPage ? (
              <View className="py-4 items-center">
                <Text className="text-gray-500 text-sm">Desliza para cargar más</Text>
              </View>
            ) : sales.length > 0 ? (
              <View className="py-4 items-center">
                <Text className="text-gray-500 text-sm">{sales.length} ventas en total</Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View className="h-2" />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage}
              onRefresh={() => refetch()}
              tintColor="#3B82F6"
            />
          }
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
          removeClippedSubviews={true}
        />

        {/* Floating Action Button for New Sale */}
        <Fab onPress={() => router.push('/inventory/new-sale/')} placement="bottom right" size="lg">
          <Icon as={PlusIcon} className="text-white" />
        </Fab>
      </VStack>
    </View>
  );
}
