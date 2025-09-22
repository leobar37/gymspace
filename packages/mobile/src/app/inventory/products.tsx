import { BackButton } from '@/shared/components';
import { InputSearch } from '@/shared/input-search';
import React, { useCallback, useState, useMemo } from 'react';
import { Dimensions, View as RNView, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SheetManager } from '@gymspace/sheet';

import { ProductCard } from '@/components/inventory/ProductCard';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Fab, FabIcon } from '@/components/ui/fab';

import {
  useProducts,
  useProductCategories,
  useProductsFilter,
} from '@/features/products/hooks/useProducts';
import type { Product } from '@gymspace/sdk';
import { InfoIcon, PackageIcon, PlusIcon, FilterIcon } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_PADDING = 1;
const CONTAINER_PADDING = 10;
const CARDS_PER_ROW = 2;
const CARD_WIDTH =
  (screenWidth - CONTAINER_PADDING * 2 - CARD_PADDING * (CARDS_PER_ROW + 1)) / CARDS_PER_ROW;

// Fixed header height for sticky positioning
const HEADER_HEIGHT = 10;
const SEARCH_BAR_HEIGHT = 10;

// Product Search Header Component
interface ProductSearchHeaderProps {
  searchInput: string;
  onSearchInputChange: (text: string) => void;
  onSearch: () => void;
  onShowFilters: () => void;
  activeFiltersCount: number;
}

const ProductSearchHeader: React.FC<ProductSearchHeaderProps> = ({
  searchInput,
  onSearchInputChange,
  onSearch,
  onShowFilters,
  activeFiltersCount,
}) => {
  return (
    <RNView
      style={{
        position: 'absolute',
        top: 12,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'white',
      }}
    >
      <VStack>
        {/* Search and Filter Bar */}
        <HStack className="px-4  bg-white" style={{ minHeight: SEARCH_BAR_HEIGHT }} space="sm">
          <View className="flex-1">
            <InputSearch
              value={searchInput}
              onChangeText={onSearchInputChange}
              placeholder="Buscar productos..."
              onClear={() => {
                onSearchInputChange('');
                onSearch();
              }}
            />
          </View>
          <Pressable
            onPress={onShowFilters}
            className="px-3 py-2 bg-gray-100 rounded-lg flex-row items-center"
          >
            <Icon as={FilterIcon} className="w-5 h-5 text-gray-700" />
            {activeFiltersCount > 0 && (
              <Badge variant="solid" size="sm" className="ml-2 bg-blue-500">
                <BadgeText className="text-white text-xs">{activeFiltersCount}</BadgeText>
              </Badge>
            )}
          </Pressable>
        </HStack>
      </VStack>
    </RNView>
  );
};

export default function ProductsScreen() {
  const [searchInput, setSearchInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load all products (up to 100)
  const {
    data: products = [],
    isLoading,
    error,
    refetch,
  } = useProducts({
    enabled: true,
  });

  // Get categories for filters
  const { data: categories = [] } = useProductCategories();

  // Use local filtering hook
  const { filteredProducts, filters, setFilters, updateFilter, activeFiltersCount } =
    useProductsFilter({ products });

  const handleSearch = useCallback(() => {
    updateFilter('search', searchInput);
  }, [searchInput, updateFilter]);

  const handleFiltersChange = useCallback(
    (newFilters: any) => {
      // Extract only the filter properties we need, excluding pagination
      const { categoryId, status, inStock, minPrice, maxPrice, search } = newFilters;
      setFilters({
        categoryId,
        status,
        inStock,
        minPrice,
        maxPrice,
        search,
      });
    },
    [setFilters],
  );

  const handleShowFilters = useCallback(() => {
    SheetManager.show('product-filters', {
      payload: {
        currentFilters: {
          ...filters,
          page: 1,
          limit: 100,
        },
        categories,
        onApplyFilters: handleFiltersChange,
      },
    });
  }, [filters, categories, handleFiltersChange]);

  const handleProductPress = useCallback((product: Product) => {
    router.push(`/inventory/products/${product.id}`);
  }, []);

  const handleProductLongPress = useCallback((product: Product) => {
    // Show action sheet or quick actions
    console.log('Long press on product:', product.name);
  }, []);

  const handleAddProduct = useCallback(() => {
    router.push('/inventory/products/new');
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderProductCard = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <RNView
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
      </RNView>
    ),
    [handleProductPress, handleProductLongPress],
  );

  const renderEmptyState = useCallback(() => {
    const hasFilters = activeFiltersCount > 0;

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
                : 'Comienza agregando tu primer producto al inventario'}
            </Text>
          </VStack>

          {!hasFilters && (
            <Button onPress={handleAddProduct} className="mt-4">
              <Icon as={PlusIcon} className="w-4 h-4 mr-2 text-white" />
              <ButtonText>Agregar Producto</ButtonText>
            </Button>
          )}
        </VStack>
      </View>
    );
  }, [activeFiltersCount, handleAddProduct]);

  const renderErrorState = useCallback(
    () => (
      <View className="flex-1 items-center justify-center px-8">
        <Alert action="error" variant="solid" className="max-w-sm">
          <AlertIcon as={InfoIcon} />
          <AlertText>
            Error al cargar los productos: {error?.message || 'Error desconocido'}
          </AlertText>
        </Alert>
        <Button variant="outline" onPress={() => refetch()} className="mt-4">
          <ButtonText>Reintentar</ButtonText>
        </Button>
      </View>
    ),
    [error, refetch],
  );

  // List header with padding to account for fixed header
  const ListHeader = useMemo(
    () => (
      <RNView>
        {/* Spacer for fixed header */}
        <RNView style={{ height: HEADER_HEIGHT + SEARCH_BAR_HEIGHT + 18 }} />

        {/* Results Summary */}
        {filteredProducts.length > 0 && (
          <HStack className="justify-between items-center px-4">
            <Text className="text-sm text-gray-600">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}{' '}
              encontrado
              {filteredProducts.length !== 1 ? 's' : ''}
            </Text>
            {activeFiltersCount > 0 && (
              <Text className="text-sm text-gray-500">
                {products.length} producto{products.length !== 1 ? 's' : ''} en total
              </Text>
            )}
          </HStack>
        )}
      </RNView>
    ),
    [filteredProducts.length, products.length, activeFiltersCount],
  );

  // Show loading state
  if (isLoading && products.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <ProductSearchHeader
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onShowFilters={handleShowFilters}
          activeFiltersCount={activeFiltersCount}
        />
        <View className="flex-1 items-center justify-center">
          <Spinner size="large" />
          <Text className="text-gray-600 mt-4">Cargando productos...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error && products.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <ProductSearchHeader
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onShowFilters={handleShowFilters}
          activeFiltersCount={activeFiltersCount}
        />
        {renderErrorState()}
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Fixed Header */}
      <ProductSearchHeader
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        onShowFilters={handleShowFilters}
        activeFiltersCount={activeFiltersCount}
      />
      {/* Content */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        numColumns={CARDS_PER_ROW}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={renderEmptyState()}
        contentContainerStyle={{
          paddingHorizontal: CONTAINER_PADDING,
          paddingBottom: 80, // Space for FAB
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
        removeClippedSubviews={true}
      />

      {/* Floating Action Button */}
      <Fab onPress={handleAddProduct} size="lg" placement="bottom right">
        <FabIcon as={PlusIcon} />
      </Fab>
    </SafeAreaView>
  );
}
