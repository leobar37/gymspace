import React, { useState, useCallback } from 'react';
import { SheetManager } from '@gymspace/sheet';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { InputSearch } from '@/shared/input-search';

import {
  SearchIcon,
  FilterIcon,
} from 'lucide-react-native';

import { type SearchSalesParams } from '@gymspace/sdk';

interface SalesSearchAndFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearch: (term: string) => void;
  filters: SearchSalesParams;
  onFiltersChange: (filters: SearchSalesParams) => void;
  activeFiltersCount: number;
}

export const SalesSearchAndFilters: React.FC<SalesSearchAndFiltersProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  filters,
  onFiltersChange,
  activeFiltersCount,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const handleSearchPress = useCallback(() => {
    onSearch(localSearchTerm);
  }, [localSearchTerm, onSearch]);

  const handleClear = useCallback(() => {
    setLocalSearchTerm('');
    onSearchTermChange('');
    onSearch('');
  }, [onSearchTermChange, onSearch]);

  const handleOpenFilters = useCallback(() => {
    SheetManager.show('sales-filters', {
      payload: {
        currentFilters: filters,
        onApplyFilters: onFiltersChange,
      },
    });
  }, [filters, onFiltersChange]);

  return (
    <View className="bg-white shadow-sm border-b border-gray-100">
      <VStack className="p-4" space="lg">
        {/* Search Bar and Filters */}
        <HStack space="md" className="items-center">
          <View className="flex-1">
            <InputSearch
              placeholder="Buscar por cliente..."
              value={localSearchTerm}
              onChangeText={setLocalSearchTerm}
              onClear={handleClear}
            />
          </View>

          <Button
            variant="outline"
            size="md"
            onPress={handleSearchPress}
            className="border-gray-300 px-4"
          >
            <Icon as={SearchIcon} className="w-5 h-5 text-gray-600" />
          </Button>

          <Button
            variant="outline"
            size="md"
            onPress={handleOpenFilters}
            className={`border-gray-300 px-4 ${activeFiltersCount > 0 ? 'bg-blue-50 border-blue-300' : ''}`}
          >
            <HStack space="xs" className="items-center">
              <Icon
                as={FilterIcon}
                className={`w-5 h-5 ${activeFiltersCount > 0 ? 'text-blue-600' : 'text-gray-600'}`}
              />
              {activeFiltersCount > 0 && (
                <View className="bg-blue-600 rounded-full px-1.5 py-0.5 min-w-[20px]">
                  <Text className="text-xs text-white font-bold text-center">
                    {activeFiltersCount}
                  </Text>
                </View>
              )}
            </HStack>
          </Button>
        </HStack>
      </VStack>
    </View>
  );
};