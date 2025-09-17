import React, { useState, useCallback } from 'react';
import { BottomSheetWrapper, SheetProps, SheetManager } from '@gymspace/sheet';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Pressable } from '@/components/ui/pressable';
import {
  CalendarIcon,
  CreditCardIcon,
  ClockIcon,
  XIcon,
  UserIcon,
  CheckIcon
} from 'lucide-react-native';
import type { SearchSalesParams } from '@gymspace/sdk';
import { View } from '@/components/ui/view';


const QUICK_DATE_FILTERS = [
  { key: 'today', label: 'Hoy', days: 0 },
  { key: 'yesterday', label: 'Ayer', days: 1 },
  { key: 'week', label: 'Esta semana', days: 7 },
  { key: 'month', label: 'Este mes', days: 30 },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { key: 'all', label: 'Todos', value: undefined },
  { key: 'paid', label: 'Pagados', value: 'paid' as const },
  { key: 'unpaid', label: 'Pendientes', value: 'unpaid' as const },
] as const;

interface SalesFiltersSheetProps extends SheetProps {
  currentFilters?: SearchSalesParams;
  onApplyFilters?: (filters: SearchSalesParams) => void;
}

export function SalesFiltersSheet(props: SalesFiltersSheetProps) {
  const { currentFilters, onApplyFilters } = props;
  const [tempFilters, setTempFilters] = useState<SearchSalesParams>(currentFilters || { page: 1, limit: 20 });
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  const handleQuickDateFilter = useCallback((key: string, days: number) => {
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

    setTempFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      page: 1,
    }));
    setSelectedDateFilter(key);
  }, []);

  const handlePaymentStatusFilter = useCallback((paymentStatus: 'paid' | 'unpaid' | undefined) => {
    setTempFilters(prev => ({
      ...prev,
      paymentStatus,
      page: 1,
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    const clearedFilters: SearchSalesParams = {
      page: 1,
      limit: currentFilters?.limit || 20,
    };
    
    setTempFilters(clearedFilters);
    setSelectedDateFilter(null);
  }, [currentFilters?.limit]);

  const handleApplyFilters = useCallback(() => {
    onApplyFilters?.(tempFilters);
    SheetManager.hide('sales-filters');
  }, [tempFilters, onApplyFilters]);

  const handleCancel = useCallback(() => {
    SheetManager.hide('sales-filters');
  }, []);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (tempFilters.paymentStatus) count++;
    if (tempFilters.startDate) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <BottomSheetWrapper
      sheetId="sales-filters"
      scrollable
      snapPoints={['75%']}
      enablePanDownToClose
    >
      <VStack className="px-4 py-4">
        {/* Header */}
        <HStack className="items-center justify-between mb-4">
          <Text className="text-lg font-semibold">Filtrar Ventas</Text>
          {activeFiltersCount > 0 && (
            <Badge variant="solid" className="bg-blue-100">
              <BadgeText className="text-blue-700">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro' : 'filtros'}
              </BadgeText>
            </Badge>
          )}
        </HStack>

        {/* Quick Date Filters */}
        <VStack space="sm" className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Período
          </Text>
          <VStack space="sm">
            {QUICK_DATE_FILTERS.map((filter) => {
              const isSelected = selectedDateFilter === filter.key;
              return (
                <Pressable
                  key={filter.key}
                  onPress={() => handleQuickDateFilter(filter.key, filter.days)}
                  className={`p-3 rounded-lg border ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <HStack className="items-center justify-between">
                    <HStack space="sm" className="items-center">
                      <Icon 
                        as={CalendarIcon} 
                        className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} 
                      />
                      <Text className={isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                        {filter.label}
                      </Text>
                    </HStack>
                    {isSelected && (
                      <Icon as={CheckIcon} className="w-4 h-4 text-blue-600" />
                    )}
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>
        </VStack>

        {/* Payment Status Filter */}
        <VStack space="sm" className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Estado de pago
          </Text>
          <HStack space="sm">
            {PAYMENT_STATUS_OPTIONS.map((option) => {
              const isActive = tempFilters.paymentStatus === option.value;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => handlePaymentStatusFilter(option.value)}
                  className="flex-1"
                >
                  <View 
                    className={`p-3 rounded-lg border items-center ${
                      isActive 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Icon 
                      as={option.key === 'paid' ? CreditCardIcon : option.key === 'unpaid' ? ClockIcon : UserIcon}
                      className={`w-5 h-5 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} 
                    />
                    <Text className={`text-sm ${isActive ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </HStack>
        </VStack>

        {/* Action Buttons */}
        <VStack space="sm">
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              onPress={handleClearFilters}
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