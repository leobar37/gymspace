import React, { useCallback, useState, useMemo } from 'react';
import { Dimensions, View as RNView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SheetManager } from 'react-native-actions-sheet';

import { ProductCard } from '@/components/inventory/ProductCard';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Fab, FabIcon } from '@/components/ui/fab';

import { useProductCategories } from '@/features/products/hooks/useProducts';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useInfiniteScroll, InfiniteScrollList } from '@/shared/pagination';

import type { Product, SearchProductsParams } from '@gymspace/sdk';
import {
  ChevronLeftIcon,
  InfoIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_PADDING = 8;
const CONTAINER_PADDING = 16;
const CARDS_PER_ROW = 2;
const CARD_WIDTH =
  (screenWidth - CONTAINER_PADDING * 2 - CARD_PADDING * (CARDS_PER_ROW + 1)) / CARDS_PER_ROW;

// Fixed header height for sticky positioning
const HEADER_HEIGHT = 56;
const SEARCH_BAR_HEIGHT = 56;

export default function ProductsScreen() {
  const { sdk } = useGymSdk();
  const [filters, setFilters] = useState<SearchProductsParams>({ page: 1, limit: 20 });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Get categories for filters
  const { data: categories = [] } = useProductCategories();

  // Use infinite scroll pagination hook
  const pagination = useInfiniteScroll({
    queryKey: ['products', 'list', filters, searchTerm] as const,
    queryFn: async (params) => {
      const response = await sdk.products.searchProducts({
        ...filters,
        ...params,
        search: searchTerm || undefined,
      });
      
      return {
        data: response.data,
        meta: response.meta,
      };
    },
    limit: 20,
    enabled: true,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const {
    allItems: products = [],
    state,
    error,
    isFetching,
    refresh,
  } = pagination;

  const handleSearch = useCallback(() => {
    if (searchInput !== searchTerm) {
      setSearchTerm(searchInput);
      setFilters((prev) => ({
        ...prev,
        page: 1,
      }));
    }
  }, [searchInput, searchTerm]);

  const handleFiltersChange = useCallback((newFilters: SearchProductsParams) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  }, []);

  const handleShowFilters = useCallback(() => {
    SheetManager.show('product-filters', {
      payload: {
        currentFilters: filters,
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
    const hasFilters = !!(
      filters.search ||
      filters.categoryId ||
      filters.status ||
      filters.inStock ||
      filters.minPrice ||
      filters.maxPrice ||
      searchTerm
    );

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
  }, [filters, searchTerm, handleAddProduct]);

  const renderErrorState = useCallback(() => (
    <View className="flex-1 items-center justify-center px-8">
      <Alert action="error" variant="solid" className="max-w-sm">
        <AlertIcon as={InfoIcon} />
        <AlertText>
          Error al cargar los productos: {error?.message || 'Error desconocido'}
        </AlertText>
      </Alert>
      <Button variant="outline" onPress={() => refresh()} className="mt-4">
        <ButtonText>Reintentar</ButtonText>
      </Button>
    </View>
  ), [error, refresh]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.categoryId) count++;
    if (filters.inStock !== undefined) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    return count;
  }, [filters]);

  // Fixed header component
  const FixedHeader = useMemo(() => (
    <RNView 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
      }}
    >
      <SafeAreaView edges={['top']}>
        <VStack>
          {/* Navigation Header */}
          <HStack 
            className="items-center justify-between px-4 bg-white"
            style={{ height: HEADER_HEIGHT }}
          >
            <HStack className="items-center flex-1">
              <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                <Icon as={ChevronLeftIcon} className="w-6 h-6 text-gray-700" />
              </Pressable>
              <Text className="text-xl font-semibold text-gray-900 ml-2">Productos</Text>
            </HStack>
          </HStack>

          {/* Search and Filter Bar */}
          <HStack 
            className="px-4 pb-3 bg-white border-b border-gray-200"
            style={{ minHeight: SEARCH_BAR_HEIGHT }}
            space="sm"
          >
            <View className="flex-1">
              <Input size="md" variant="outline">
                <InputSlot className="pl-3">
                  <InputIcon as={SearchIcon} className="text-gray-500" />
                </InputSlot>
                <InputField
                  placeholder="Buscar productos..."
                  value={searchInput}
                  onChangeText={setSearchInput}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
              </Input>
            </View>
            <Pressable
              onPress={handleShowFilters}
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
      </SafeAreaView>
    </RNView>
  ), [searchInput, activeFiltersCount, handleSearch, handleShowFilters]);

  // List header with padding to account for fixed header
  const ListHeader = useMemo(() => (
    <RNView style={{ height: HEADER_HEIGHT + SEARCH_BAR_HEIGHT + 60 }}>
      {/* Results Summary */}
      {state.total > 0 && (
        <HStack className="justify-between items-center px-4 py-2">
          <Text className="text-sm text-gray-600">
            {state.total} producto{state.total !== 1 ? 's' : ''} encontrado
            {state.total !== 1 ? 's' : ''}
          </Text>
          {state.totalPages > 1 && (
            <Text className="text-sm text-gray-500">
              Mostrando {products.length} de {state.total}
            </Text>
          )}
        </HStack>
      )}
    </RNView>
  ), [state.total, state.totalPages, products.length]);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Fixed Header */}
      {FixedHeader}

      {/* Loading Overlay */}
      {isFetching && products.length > 0 && (
        <RNView 
          style={{
            position: 'absolute',
            top: HEADER_HEIGHT + SEARCH_BAR_HEIGHT + 60,
            left: 0,
            right: 0,
            zIndex: 999,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <HStack space="sm" className="items-center">
            <Spinner size="small" />
            <Text className="text-gray-600 text-sm">Actualizando productos...</Text>
          </HStack>
        </RNView>
      )}

      {/* Content */}
      <InfiniteScrollList
        pagination={pagination}
        renderItem={renderProductCard}
        numColumns={CARDS_PER_ROW}
        ListHeaderComponent={ListHeader}
        emptyComponent={renderEmptyState()}
        errorComponent={renderErrorState()}
        contentContainerStyle={{
          paddingHorizontal: CONTAINER_PADDING,
          paddingBottom: 20,
        }}
        enableRefresh={true}
        onEndReachedThreshold={0.3}
        performanceConfig={{
          maxToRenderPerBatch: 10,
          windowSize: 10,
          initialNumToRender: 8,
          removeClippedSubviews: true,
        }}
      />

      {/* Floating Action Button */}
      <Fab
        onPress={handleAddProduct}
        className="bg-blue-600"
        size="lg"
        placement="bottom right"
      >
        <FabIcon as={PlusIcon} />
      </Fab>
    </View>
  );
}