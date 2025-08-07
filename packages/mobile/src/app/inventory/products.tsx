import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { View } from '@/components/ui/view';
import { Spinner } from '@/components/ui/spinner';
import { Icon } from '@/components/ui/icon';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { PlusIcon, PackageIcon, InfoIcon } from 'lucide-react-native';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/inventory/ProductCard';
import { ProductFilters } from '@/components/inventory/ProductFilters';
import { router } from 'expo-router';
import type { Product, SearchProductsParams } from '@gymspace/sdk';

const { width: screenWidth } = Dimensions.get('window');
const CARD_PADDING = 8;
const CONTAINER_PADDING = 16;
const CARDS_PER_ROW = 2;
const CARD_WIDTH = (screenWidth - (CONTAINER_PADDING * 2) - (CARD_PADDING * (CARDS_PER_ROW + 1))) / CARDS_PER_ROW;

export default function ProductsScreen() {
  const [filters, setFilters] = useState<SearchProductsParams>({ page: 1, limit: 20 });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch
  } = useProducts({
    ...filters,
    search: searchTerm || undefined,
  });

  const handleFiltersChange = useCallback((newFilters: SearchProductsParams) => {
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

  const handleProductPress = useCallback((product: Product) => {
    // Navigate to product detail or add to cart
    router.push(`/inventory/products/${product.id}`);
  }, []);

  const handleProductLongPress = useCallback((product: Product) => {
    // Show action sheet or quick actions
    console.log('Long press on product:', product.name);
  }, []);

  const handleAddProduct = useCallback(() => {
    router.push('/inventory/products/new');
  }, []);

  const handleLoadMore = useCallback(() => {
    if (data?.hasNextPage && !isFetching) {
      setFilters(prev => ({
        ...prev,
        page: (prev.page || 1) + 1,
      }));
    }
  }, [data?.hasNextPage, isFetching]);

  const renderProductCard = useCallback(({ item, index }: { item: Product; index: number }) => (
    <View 
      style={{ 
        width: CARD_WIDTH,
        marginLeft: index % CARDS_PER_ROW === 0 ? 0 : CARD_PADDING,
        marginBottom: CARD_PADDING,
      }}
    >
      <ProductCard
        product={item}
        onPress={handleProductPress}
        onLongPress={handleProductLongPress}
        compact={false}
      />
    </View>
  ), [handleProductPress, handleProductLongPress]);

  const renderHeader = useCallback(() => (
    <VStack space="sm">
      <ProductFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />
      
      {/* Add Product Button */}
      <HStack className="justify-between items-center px-4">
        <Text className="text-lg font-semibold text-gray-900">
          Productos
        </Text>
        <Button
          size="sm"
          onPress={handleAddProduct}
          className="bg-blue-600"
        >
          <Icon as={PlusIcon} className="w-4 h-4 text-white mr-2" />
          <ButtonText className="text-white">Agregar</ButtonText>
        </Button>
      </HStack>

      {/* Results Summary */}
      {data && (
        <HStack className="justify-between items-center px-4 py-2">
          <Text className="text-sm text-gray-600">
            {data.total} producto{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
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
    handleAddProduct,
  ]);

  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;

    const hasFilters = !!(filters.search || filters.categoryId || filters.status || filters.inStock || searchTerm);

    return (
      <View className="flex-1 items-center justify-center py-12 px-8">
        <VStack space="md" className="items-center">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center">
            <Icon as={PackageIcon} className="w-10 h-10 text-gray-400" />
          </View>
          
          <VStack space="xs" className="items-center">
            <Text className="text-lg font-medium text-gray-900 text-center">
              {hasFilters ? 'No se encontraron productos' : 'No hay productos'}
            </Text>
            <Text className="text-gray-600 text-center">
              {hasFilters 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando tu primer producto al inventario'
              }
            </Text>
          </VStack>

          {!hasFilters && (
            <Button
              onPress={handleAddProduct}
              className="bg-blue-600 mt-4"
            >
              <Icon as={PlusIcon} className="w-4 h-4 text-white mr-2" />
              <ButtonText className="text-white">Agregar Producto</ButtonText>
            </Button>
          )}
        </VStack>
      </View>
    );
  }, [isLoading, filters, searchTerm, handleAddProduct]);

  const renderFooter = useCallback(() => {
    if (!isFetching || !data?.hasNextPage) return null;

    return (
      <View className="py-4 items-center">
        <HStack space="sm" className="items-center">
          <Spinner size="small" />
          <Text className="text-gray-600 text-sm">Cargando más productos...</Text>
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
                Error al cargar los productos: {error?.message || 'Error desconocido'}
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
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        numColumns={CARDS_PER_ROW}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ 
          paddingHorizontal: CONTAINER_PADDING,
          paddingBottom: 20,
          flexGrow: data?.items?.length === 0 ? 1 : undefined,
        }}
        columnWrapperStyle={undefined} // Let custom styling handle spacing
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