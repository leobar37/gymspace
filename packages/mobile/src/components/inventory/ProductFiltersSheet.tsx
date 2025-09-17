import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { BottomSheetWrapper, SheetProps, SheetManager } from '@gymspace/sheet';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Pressable } from '@/components/ui/pressable';
import { View } from '@/components/ui/view';
import {
  PackageIcon,
  XIcon,
  CheckCircleIcon,
  XCircleIcon,
  DollarSignIcon,
  TagIcon,
} from 'lucide-react-native';
import type { SearchProductsParams } from '@gymspace/sdk';

const PRODUCT_STATUS_OPTIONS = [
  { key: 'all', label: 'Todos', value: undefined, icon: PackageIcon, color: 'gray' },
  { key: 'active', label: 'Activo', value: 'active' as const, icon: CheckCircleIcon, color: 'green' },
  { key: 'inactive', label: 'Inactivo', value: 'inactive' as const, icon: XCircleIcon, color: 'red' },
] as const;

const STOCK_FILTERS = [
  { key: 'all', label: 'Todo', value: undefined },
  { key: 'in_stock', label: 'En Stock', value: true },
  { key: 'out_stock', label: 'Sin Stock', value: false },
] as const;

const PRICE_RANGES = [
  { key: 'all', label: 'Todos', min: undefined, max: undefined },
  { key: 'low', label: '< $10', min: 0, max: 10 },
  { key: 'medium', label: '$10 - $50', min: 10, max: 50 },
  { key: 'high', label: '$50 - $100', min: 50, max: 100 },
  { key: 'premium', label: '> $100', min: 100, max: undefined },
] as const;

interface ProductFiltersSheetProps extends SheetProps {
  currentFilters?: SearchProductsParams;
  categories?: { id: string; name: string }[];
  onApplyFilters?: (filters: SearchProductsParams) => void;
}

export function ProductFiltersSheet(props: ProductFiltersSheetProps) {
  const { currentFilters, categories = [], onApplyFilters } = props;
  const [tempFilters, setTempFilters] = useState<SearchProductsParams>(currentFilters || { page: 1, limit: 20 });
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');

  const handleStatusFilter = useCallback((status: 'active' | 'inactive' | undefined) => {
    setTempFilters(prev => ({
      ...prev,
      status,
      page: 1,
    }));
  }, []);

  const handleStockFilter = useCallback((inStock: boolean | undefined) => {
    setTempFilters(prev => ({
      ...prev,
      inStock,
      page: 1,
    }));
  }, []);

  const handleCategoryFilter = useCallback((categoryId: string | undefined) => {
    setTempFilters(prev => ({
      ...prev,
      categoryId,
      page: 1,
    }));
  }, []);

  const handlePriceRange = useCallback((key: string, min?: number, max?: number) => {
    setSelectedPriceRange(key);
    setTempFilters(prev => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
      page: 1,
    }));
  }, []);

  // Memoize cleared filters object to avoid recreating on every render
  const clearedFilters = useMemo<SearchProductsParams>(() => ({
    page: 1,
    limit: currentFilters?.limit || 20,
    status: undefined,
    categoryId: undefined,
    inStock: undefined,
    minPrice: undefined,
    maxPrice: undefined,
  }), [currentFilters?.limit]);

  const handleClearFilters = useCallback(() => {
    setTempFilters(clearedFilters);
    setSelectedPriceRange('all');
  }, [clearedFilters]);

  const handleApplyFilters = useCallback(() => {
    onApplyFilters?.(tempFilters);
    SheetManager.hide('product-filters');
  }, [tempFilters, onApplyFilters]);

  const handleCancel = useCallback(() => {
    SheetManager.hide('product-filters');
  }, []);

  // Reset temp filters when currentFilters change to prevent stale state
  useEffect(() => {
    if (currentFilters) {
      setTempFilters(currentFilters);
      // Update price range selection based on current filters
      const currentRange = PRICE_RANGES.find(range =>
        range.min === currentFilters.minPrice && range.max === currentFilters.maxPrice
      );
      setSelectedPriceRange(currentRange?.key || 'all');
    }
  }, [currentFilters]);

  // Memoize active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (tempFilters.status) count++;
    if (tempFilters.inStock !== undefined) count++;
    if (tempFilters.categoryId) count++;
    if (tempFilters.minPrice || tempFilters.maxPrice) count++;
    return count;
  }, [tempFilters.status, tempFilters.inStock, tempFilters.categoryId, tempFilters.minPrice, tempFilters.maxPrice]);

  // Memoize color utilities
  const getStatusColor = useMemo(() => (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600';
      case 'red': return 'text-red-600';
      case 'yellow': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  }, []);

  const getStatusBgColor = useMemo(() => (color: string, isActive: boolean) => {
    if (!isActive) return 'bg-white border-gray-200';
    switch (color) {
      case 'green': return 'bg-green-50 border-green-300';
      case 'red': return 'bg-red-50 border-red-300';
      case 'yellow': return 'bg-yellow-50 border-yellow-300';
      default: return 'bg-gray-50 border-gray-300';
    }
  }, []);

  return (
    <BottomSheetWrapper
      sheetId="product-filters"
      scrollable
      snapPoints={['85%']}
    >
      <VStack className="px-4 py-4">
        {/* Header */}
        <HStack className="items-center justify-between mb-4">
          <Text className="text-lg font-semibold">Filtrar Productos</Text>
          {activeFiltersCount > 0 && (
            <Badge variant="solid" className="bg-blue-100">
              <BadgeText className="text-blue-700">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro' : 'filtros'}
              </BadgeText>
            </Badge>
          )}
        </HStack>

        {/* Product Status Filter */}
        <VStack space="sm" className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Estado del producto
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PRODUCT_STATUS_OPTIONS.map((option) => {
              const isActive = tempFilters.status === option.value || 
                              (!tempFilters.status && !option.value);
              return (
                <Pressable
                  key={option.key}
                  onPress={() => handleStatusFilter(option.value)}
                  className="basis-[48%]"
                >
                  <View 
                    className={`p-3 rounded-lg border items-center ${
                      getStatusBgColor(option.color, isActive)
                    }`}
                  >
                    <Icon 
                      as={option.icon}
                      className={`w-5 h-5 mb-1 ${isActive ? getStatusColor(option.color) : 'text-gray-600'}`} 
                    />
                    <Text className={`text-xs text-center ${isActive ? 'font-medium' : ''} ${
                      isActive ? getStatusColor(option.color) : 'text-gray-700'
                    }`}>
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </VStack>

        {/* Stock Filter */}
        <VStack space="sm" className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Disponibilidad
          </Text>
          <HStack space="sm">
            {STOCK_FILTERS.map((filter) => {
              const isActive = tempFilters.inStock === filter.value;
              return (
                <Pressable
                  key={filter.key}
                  onPress={() => handleStockFilter(filter.value)}
                  className="flex-1"
                >
                  <View 
                    className={`p-3 rounded-lg border items-center ${
                      isActive ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text className={`text-sm ${isActive ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                      {filter.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </HStack>
        </VStack>

        {/* Category Filter */}
        {categories.length > 0 && (
          <VStack space="sm" className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Categoría
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => handleCategoryFilter(undefined)}
                className="px-3 py-2"
              >
                <View 
                  className={`px-3 py-2 rounded-lg border ${
                    !tempFilters.categoryId ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                  }`}
                >
                  <HStack space="xs" className="items-center">
                    <Icon 
                      as={TagIcon} 
                      className={`w-4 h-4 ${!tempFilters.categoryId ? 'text-blue-600' : 'text-gray-600'}`} 
                    />
                    <Text className={`text-sm ${!tempFilters.categoryId ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                      Todas
                    </Text>
                  </HStack>
                </View>
              </Pressable>
              {categories.map((category: { id: string; name: string }) => {
                const isActive = tempFilters.categoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => handleCategoryFilter(category.id)}
                    className="px-3 py-2"
                  >
                    <View 
                      className={`px-3 py-2 rounded-lg border ${
                        isActive ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                      }`}
                    >
                      <HStack space="xs" className="items-center">
                        <Icon 
                          as={TagIcon} 
                          className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} 
                        />
                        <Text className={`text-sm ${isActive ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                          {category.name}
                        </Text>
                      </HStack>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </VStack>
        )}

        {/* Price Range Filter */}
        <VStack space="sm" className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Rango de precio
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PRICE_RANGES.map((range) => {
              const isActive = selectedPriceRange === range.key;
              return (
                <Pressable
                  key={range.key}
                  onPress={() => handlePriceRange(range.key, range.min, range.max)}
                  className="basis-[31%]"
                >
                  <View 
                    className={`p-3 rounded-lg border items-center ${
                      isActive ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                    }`}
                  >
                    <Icon 
                      as={DollarSignIcon}
                      className={`w-4 h-4 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} 
                    />
                    <Text className={`text-xs text-center ${isActive ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                      {range.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </VStack>

        {/* Action Buttons */}
        <VStack space="sm">
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              onPress={() => {
                handleClearFilters();
                // Apply cleared filters immediately
                onApplyFilters?.(clearedFilters);
                SheetManager.hide('product-filters');
              }}
              className="border-gray-300"
            >
              <Icon as={XIcon} className="w-4 h-4 text-gray-600 mr-2" />
              <ButtonText className="text-gray-700">Limpiar filtros</ButtonText>
            </Button>
          )}
          
          <HStack space="sm">
            <Button
              variant="outline"
              onPress={handleCancel}
              className="flex-1 border-gray-300"
            >
              <ButtonText className="text-gray-700">Cancelar</ButtonText>
            </Button>
            
            <Button
              variant="solid"
              onPress={handleApplyFilters}
              className="flex-1"
            >
              <ButtonText>Aplicar filtros</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </VStack>
    </BottomSheetWrapper>
  );
}