import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { 
  SearchIcon, 
  FilterIcon, 
  XIcon,
  ChevronDownIcon 
} from 'lucide-react-native';
import type { ProductCategory, SearchProductsParams } from '@gymspace/sdk';
import { useProductCategories } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';

interface ProductFiltersProps {
  filters: SearchProductsParams;
  onFiltersChange: (filters: SearchProductsParams) => void;
  onSearch: (searchTerm: string) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  showFilters = false,
  onToggleFilters,
}) => {
  const [searchText, setSearchText] = useState(filters.search || '');
  const { data: categories = [] } = useProductCategories();
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce((value: string) => {
    onSearch(value);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategory = filters.categoryId;
    const newCategoryId = currentCategory === categoryId ? undefined : categoryId;
    onFiltersChange({ ...filters, categoryId: newCategoryId });
  };

  const handleStatusToggle = (status: 'active' | 'inactive') => {
    const currentStatus = filters.status;
    const newStatus = currentStatus === status ? undefined : status;
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handleStockToggle = () => {
    onFiltersChange({ ...filters, inStock: !filters.inStock });
  };

  const clearFilters = () => {
    setSearchText('');
    onFiltersChange({});
    onSearch('');
  };

  const hasActiveFilters = !!(
    filters.categoryId || 
    filters.status || 
    filters.inStock || 
    filters.search
  );

  return (
    <VStack space="md" className="bg-white p-4 border-b border-gray-200">
      {/* Search Bar */}
      <HStack space="sm" className="items-center">
        <VStack className="flex-1">
          <Input variant="outline" size="md">
            <InputField
              placeholder="Buscar productos..."
              value={searchText}
              onChangeText={handleSearchChange}
            />
          </Input>
        </VStack>
        
        <Button
          variant={showFilters ? 'solid' : 'outline'}
          size="md"
          onPress={onToggleFilters}
          className="px-3"
        >
          <Icon as={FilterIcon} className="w-5 h-5" />
        </Button>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="md"
            onPress={clearFilters}
            className="px-3"
          >
            <Icon as={XIcon} className="w-5 h-5" />
          </Button>
        )}
      </HStack>

      {/* Expanded Filters */}
      {showFilters && (
        <VStack space="md" className="pt-2 border-t border-gray-100">
          {/* Categories */}
          {categories.length > 0 && (
            <VStack space="sm">
              <Text className="font-medium text-gray-800">Categorías</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                <HStack space="xs" className="px-1">
                  {categories.map((category) => (
                    <Pressable 
                      key={category.id}
                      onPress={() => handleCategoryToggle(category.id)}
                    >
                      <Badge
                        variant={filters.categoryId === category.id ? 'solid' : 'outline'}
                        size="md"
                        className={
                          filters.categoryId === category.id
                            ? 'bg-blue-500'
                            : 'border-gray-300'
                        }
                        style={
                          filters.categoryId !== category.id && category.color
                            ? { borderColor: category.color }
                            : {}
                        }
                      >
                        <BadgeText
                          className={
                            filters.categoryId === category.id
                              ? 'text-white'
                              : category.color
                              ? 'text-gray-700'
                              : 'text-gray-600'
                          }
                          style={
                            filters.categoryId !== category.id && category.color
                              ? { color: category.color }
                              : {}
                          }
                        >
                          {category.name}
                        </BadgeText>
                      </Badge>
                    </Pressable>
                  ))}
                </HStack>
              </ScrollView>
            </VStack>
          )}

          {/* Status and Stock Filters */}
          <VStack space="sm">
            <Text className="font-medium text-gray-800">Filtros</Text>
            <HStack space="xs" className="flex-wrap">
              <Pressable onPress={() => handleStatusToggle('active')}>
                <Badge
                  variant={filters.status === 'active' ? 'solid' : 'outline'}
                  size="md"
                  className={
                    filters.status === 'active'
                      ? 'bg-green-500'
                      : 'border-gray-300'
                  }
                >
                  <BadgeText
                    className={
                      filters.status === 'active' ? 'text-white' : 'text-gray-600'
                    }
                  >
                    Activos
                  </BadgeText>
                </Badge>
              </Pressable>

              <Pressable onPress={() => handleStatusToggle('inactive')}>
                <Badge
                  variant={filters.status === 'inactive' ? 'solid' : 'outline'}
                  size="md"
                  className={
                    filters.status === 'inactive'
                      ? 'bg-red-500'
                      : 'border-gray-300'
                  }
                >
                  <BadgeText
                    className={
                      filters.status === 'inactive' ? 'text-white' : 'text-gray-600'
                    }
                  >
                    Inactivos
                  </BadgeText>
                </Badge>
              </Pressable>

              <Pressable onPress={handleStockToggle}>
                <Badge
                  variant={filters.inStock ? 'solid' : 'outline'}
                  size="md"
                  className={
                    filters.inStock
                      ? 'bg-blue-500'
                      : 'border-gray-300'
                  }
                >
                  <BadgeText
                    className={filters.inStock ? 'text-white' : 'text-gray-600'}
                  >
                    Con Stock
                  </BadgeText>
                </Badge>
              </Pressable>
            </HStack>
          </VStack>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <VStack space="xs">
              <Text className="text-sm text-gray-600">
                Filtros activos: {[
                  filters.search && 'Búsqueda',
                  filters.categoryId && 'Categoría',
                  filters.status && 'Estado',
                  filters.inStock && 'Con Stock',
                ].filter(Boolean).join(', ')}
              </Text>
            </VStack>
          )}
        </VStack>
      )}
    </VStack>
  );
};