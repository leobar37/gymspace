import React, { useState, useCallback } from 'react';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Pressable } from '@/components/ui/pressable';
import {
  SearchIcon,
  CalendarIcon,
  CreditCardIcon,
  ClockIcon,
  FilterIcon,
  XIcon,
  UserIcon
} from 'lucide-react-native';
import type { SearchSalesParams } from '@gymspace/sdk';

interface SalesFiltersProps {
  filters: SearchSalesParams;
  onFiltersChange: (filters: SearchSalesParams) => void;
  onSearch: (search: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

const QUICK_DATE_FILTERS = [
  { key: 'today', label: 'Hoy', days: 0 },
  { key: 'yesterday', label: 'Ayer', days: 1 },
  { key: 'week', label: 'Esta semana', days: 7 },
  { key: 'month', label: 'Este mes', days: 30 },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { key: 'all', label: 'Todos', value: undefined },
  { key: 'paid', label: 'Pagados', value: 'paid' },
  { key: 'unpaid', label: 'Pendientes', value: 'unpaid' },
] as const;

export function SalesFilters({
  filters,
  onFiltersChange,
  onSearch,
  showFilters,
  onToggleFilters,
}: SalesFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempFilters, setTempFilters] = useState<SearchSalesParams>(filters);

  const handleSearch = useCallback(() => {
    onSearch(searchTerm.trim());
  }, [searchTerm, onSearch]);

  const handleQuickDateFilter = useCallback((days: number) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    if (days === 0) {
      // Today
      startDate.setHours(0, 0, 0, 0);
    } else if (days === 1) {
      // Yesterday
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Week/Month
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
    }

    const newFilters = {
      ...tempFilters,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      page: 1,
    };

    setTempFilters(newFilters);
    onFiltersChange(newFilters);
  }, [tempFilters, onFiltersChange]);

  const handlePaymentStatusFilter = useCallback((paymentStatus: 'paid' | 'unpaid' | undefined) => {
    const newFilters = {
      ...tempFilters,
      paymentStatus,
      page: 1,
    };

    setTempFilters(newFilters);
    onFiltersChange(newFilters);
  }, [tempFilters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters: SearchSalesParams = {
      page: 1,
      limit: filters.limit || 20,
    };
    
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setSearchTerm('');
    onSearch('');
  }, [filters.limit, onFiltersChange, onSearch]);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.paymentStatus) count++;
    if (filters.startDate) count++;
    if (filters.customerName) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <VStack space="sm">
      {/* Search Bar */}
      <HStack space="sm" className="items-center">
        <VStack className="flex-1">
          <Input className="flex-1">
            <InputField
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </Input>
        </VStack>
        
        <Button
          variant="outline"
          size="sm"
          onPress={handleSearch}
          className="border-gray-300"
        >
          <Icon as={SearchIcon} className="w-4 h-4 text-gray-600" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onPress={onToggleFilters}
          className={`border-gray-300 ${activeFiltersCount > 0 ? 'bg-blue-50 border-blue-300' : ''}`}
        >
          <Icon 
            as={FilterIcon} 
            className={`w-4 h-4 ${activeFiltersCount > 0 ? 'text-blue-600' : 'text-gray-600'}`} 
          />
          {activeFiltersCount > 0 && (
            <BadgeText className="text-blue-600 ml-1">
              {activeFiltersCount}
            </BadgeText>
          )}
        </Button>
      </HStack>

      {/* Expanded Filters */}
      {showFilters && (
        <Card className="bg-gray-50 border-gray-200">
          <VStack space="md" className="p-4">
            {/* Quick Date Filters */}
            <VStack space="xs">
              <Text className="text-sm font-medium text-gray-700">
                Período
              </Text>
              <HStack space="xs" className="flex-wrap">
                {QUICK_DATE_FILTERS.map((filter) => (
                  <Pressable
                    key={filter.key}
                    onPress={() => handleQuickDateFilter(filter.days)}
                    className="mb-2"
                  >
                    <Badge 
                      variant="outline" 
                      className="bg-white border-gray-300 active:bg-gray-100"
                    >
                      <Icon as={CalendarIcon} className="w-3 h-3 text-gray-600 mr-1" />
                      <BadgeText className="text-gray-700">{filter.label}</BadgeText>
                    </Badge>
                  </Pressable>
                ))}
              </HStack>
            </VStack>

            {/* Payment Status Filter */}
            <VStack space="xs">
              <Text className="text-sm font-medium text-gray-700">
                Estado de pago
              </Text>
              <HStack space="xs" className="flex-wrap">
                {PAYMENT_STATUS_OPTIONS.map((option) => {
                  const isActive = filters.paymentStatus === option.value;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => handlePaymentStatusFilter(option.value)}
                      className="mb-2"
                    >
                      <Badge 
                        variant={isActive ? "solid" : "outline"}
                        className={
                          isActive 
                            ? 'bg-blue-100 border-blue-300' 
                            : 'bg-white border-gray-300 active:bg-gray-100'
                        }
                      >
                        <Icon 
                          as={option.key === 'paid' ? CreditCardIcon : option.key === 'unpaid' ? ClockIcon : UserIcon}
                          className={`w-3 h-3 mr-1 ${isActive ? 'text-blue-700' : 'text-gray-600'}`} 
                        />
                        <BadgeText className={isActive ? 'text-blue-700' : 'text-gray-700'}>
                          {option.label}
                        </BadgeText>
                      </Badge>
                    </Pressable>
                  );
                })}
              </HStack>
            </VStack>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onPress={handleClearFilters}
                className="bg-white border-red-300 self-start"
              >
                <Icon as={XIcon} className="w-4 h-4 text-red-600 mr-2" />
                <ButtonText className="text-red-600">Limpiar filtros</ButtonText>
              </Button>
            )}
          </VStack>
        </Card>
      )}
    </VStack>
  );
}