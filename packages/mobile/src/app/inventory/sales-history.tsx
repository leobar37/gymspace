import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Spinner } from '@/components/ui/spinner';
import { Icon } from '@/components/ui/icon';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Button, ButtonText } from '@/components/ui/button';
import { 
  ShoppingCartIcon, 
  InfoIcon,
  TrendingUpIcon,
  DollarSignIcon,
  CalendarIcon 
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useSales } from '@/hooks/useSales';
import { useFormatPrice } from '@/config/ConfigContext';
import { SaleHistoryItem } from '@/components/inventory/SaleHistoryItem';
import { SalesFilters } from '@/components/inventory/SalesFilters';
import type { Sale, SearchSalesParams } from '@gymspace/sdk';

export default function SalesHistoryScreen() {
  const formatPrice = useFormatPrice();
  const [filters, setFilters] = useState<SearchSalesParams>({ page: 1, limit: 20 });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch
  } = useSales({
    ...filters,
    customerName: searchTerm || undefined,
  });

  const handleFiltersChange = useCallback((newFilters: SearchSalesParams) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  }, []);

  const handleSearch = useCallback((search: string) => {
    setSearchTerm(search);
    setFilters(prev => ({
      ...prev,
      page: 1, // Reset to first page when searching
    }));
  }, []);

  const handleSalePress = useCallback((sale: Sale) => {
    router.push(`/inventory/sales/${sale.id}`);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (data?.hasNextPage && !isFetching) {
      setFilters(prev => ({
        ...prev,
        page: (prev.page || 1) + 1,
      }));
    }
  }, [data?.hasNextPage, isFetching]);


  const getTodaysSalesTotal = () => {
    if (!data?.items) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return data.items
      .filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= today && saleDate < tomorrow;
      })
      .reduce((sum, sale) => sum + sale.total, 0);
  };

  const getTodaysSalesCount = () => {
    if (!data?.items) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return data.items.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      return saleDate >= today && saleDate < tomorrow;
    }).length;
  };

  const renderSaleItem = useCallback(({ item }: { item: Sale }) => (
    <SaleHistoryItem
      sale={item}
      onPress={handleSalePress}
      showCustomer={true}
    />
  ), [handleSalePress]);

  const renderHeader = useCallback(() => (
    <VStack space="md">
      {/* Quick Stats */}
      <HStack space="sm">
        <View className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
          <HStack space="sm" className="items-center">
            <Icon as={DollarSignIcon} className="w-5 h-5 text-green-600" />
            <VStack>
              <Text className="text-green-800 font-bold text-lg">
                {formatPrice(getTodaysSalesTotal())}
              </Text>
              <Text className="text-green-600 text-xs">
                Ventas de hoy
              </Text>
            </VStack>
          </HStack>
        </View>
        
        <View className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <HStack space="sm" className="items-center">
            <Icon as={ShoppingCartIcon} className="w-5 h-5 text-blue-600" />
            <VStack>
              <Text className="text-blue-800 font-bold text-lg">
                {getTodaysSalesCount()}
              </Text>
              <Text className="text-blue-600 text-xs">
                Ventas realizadas
              </Text>
            </VStack>
          </HStack>
        </View>
      </HStack>

      {/* Filters */}
      <SalesFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />
      
      {/* Results Summary */}
      {data && (
        <HStack className="justify-between items-center">
          <Text className="text-sm text-gray-600">
            {data.total} venta{data.total !== 1 ? 's' : ''} encontrada{data.total !== 1 ? 's' : ''}
          </Text>
          {data.totalPages > 1 && (
            <Text className="text-sm text-gray-500">
              Página {data.page} de {data.totalPages}
            </Text>
          )}
        </HStack>
      )}
    </VStack>
  ), [
    filters,
    showFilters,
    data,
    handleFiltersChange,
    handleSearch,
    formatPrice,
    getTodaysSalesTotal,
    getTodaysSalesCount,
  ]);

  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;

    const hasFilters = !!(filters.paymentStatus || filters.startDate || filters.endDate || searchTerm);

    return (
      <View className="flex-1 items-center justify-center py-12 px-8">
        <VStack space="md" className="items-center">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center">
            <Icon as={ShoppingCartIcon} className="w-10 h-10 text-gray-400" />
          </View>
          
          <VStack space="xs" className="items-center">
            <Text className="text-lg font-medium text-gray-900 text-center">
              {hasFilters ? 'No se encontraron ventas' : 'No hay ventas registradas'}
            </Text>
            <Text className="text-gray-600 text-center">
              {hasFilters 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Las ventas aparecerán aquí una vez que realices tu primera venta'
              }
            </Text>
          </VStack>

          {!hasFilters && (
            <Button
              onPress={() => router.push('/inventory/new-sale')}
              className="bg-blue-600 mt-4"
            >
              <Icon as={ShoppingCartIcon} className="w-4 h-4 text-white mr-2" />
              <ButtonText className="text-white">Nueva Venta</ButtonText>
            </Button>
          )}
        </VStack>
      </View>
    );
  }, [isLoading, filters, searchTerm]);

  const renderFooter = useCallback(() => {
    if (!isFetching || !data?.hasNextPage) return null;

    return (
      <View className="py-4 items-center">
        <HStack space="sm" className="items-center">
          <Spinner size="small" />
          <Text className="text-gray-600 text-sm">Cargando más ventas...</Text>
        </HStack>
      </View>
    );
  }, [isFetching, data?.hasNextPage]);

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <VStack className="flex-1 p-4">
          {renderHeader()}
          <View className="flex-1 items-center justify-center">
            <Alert action="error" variant="solid" className="max-w-sm">
              <AlertIcon as={InfoIcon} />
              <AlertText>
                Error al cargar las ventas: {error?.message || 'Error desconocido'}
              </AlertText>
            </Alert>
            <Button
              variant="outline"
              onPress={() => refetch()}
              className="mt-4"
            >
              <ButtonText>Reintentar</ButtonText>
            </Button>
          </View>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={data?.items || []}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: 20,
          flexGrow: data?.items?.length === 0 ? 1 : undefined,
        }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !isFetching}
            onRefresh={refetch}
            tintColor="#3B82F6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
      />
    </SafeAreaView>
  );
}