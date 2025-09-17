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
  FileTextIcon,
  AlertCircleIcon,
  XIcon,
  CheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
} from 'lucide-react-native';
import { ContractStatus, type GetContractsParams } from '@gymspace/sdk';
import { View } from '@/components/ui/view';

const QUICK_DATE_FILTERS = [
  { key: 'today', label: 'Hoy', days: 0 },
  { key: 'week', label: 'Esta semana', days: 7 },
  { key: 'month', label: 'Este mes', days: 30 },
  { key: 'expiring_soon', label: 'Por vencer (7 días)', days: -7 }, // negative for future
] as const;

const CONTRACT_STATUS_OPTIONS = [
  { key: 'all', label: 'Todos', value: undefined, icon: FileTextIcon, color: 'gray' },
  { key: 'active', label: 'Activos', value: ContractStatus.ACTIVE, icon: CheckCircleIcon, color: 'green' },
  { key: 'pending', label: 'Pendientes', value: ContractStatus.PENDING, icon: ClockIcon, color: 'blue' },
  { key: 'expiring', label: 'Por vencer', value: ContractStatus.EXPIRING_SOON, icon: AlertTriangleIcon, color: 'yellow' },
  { key: 'expired', label: 'Vencidos', value: ContractStatus.EXPIRED, icon: AlertCircleIcon, color: 'red' },
  { key: 'cancelled', label: 'Cancelados', value: ContractStatus.CANCELLED, icon: XCircleIcon, color: 'gray' },
] as const;

interface ContractsFiltersSheetProps extends SheetProps {
  currentFilters?: GetContractsParams;
  onApplyFilters?: (filters: GetContractsParams) => void;
}

export function ContractsFiltersSheet(props: ContractsFiltersSheetProps) {
  const { currentFilters, onApplyFilters } = props;
  const [tempFilters, setTempFilters] = useState<GetContractsParams>(currentFilters || { page: 1, limit: 20 });
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  const handleQuickDateFilter = useCallback((key: string, days: number) => {
    if (key === 'expiring_soon') {
      // Show contracts expiring in the next 7 days
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
      
      setTempFilters(prev => ({
        ...prev,
        endDateFrom: startDate.toISOString().split('T')[0],
        endDateTo: endDate.toISOString().split('T')[0],
        page: 1,
      }));
    } else {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      const startDate = new Date();
      if (days === 0) {
        // Today - contracts created today
        startDate.setHours(0, 0, 0, 0);
      } else {
        // Week/Month - contracts created in this period
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
      }

      setTempFilters(prev => ({
        ...prev,
        startDateFrom: startDate.toISOString().split('T')[0],
        startDateTo: endDate.toISOString().split('T')[0],
        page: 1,
      }));
    }
    setSelectedDateFilter(key);
  }, []);

  const handleStatusFilter = useCallback((status: ContractStatus | undefined) => {
    setTempFilters(prev => ({
      ...prev,
      status,
      page: 1,
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    const clearedFilters: GetContractsParams = {
      page: 1,
      limit: currentFilters?.limit || 20,
    };
    
    setTempFilters(clearedFilters);
    setSelectedDateFilter(null);
  }, [currentFilters?.limit]);

  const handleApplyFilters = useCallback(() => {
    onApplyFilters?.(tempFilters);
    SheetManager.hide('contracts-filters');
  }, [tempFilters, onApplyFilters]);

  const handleCancel = useCallback(() => {
    SheetManager.hide('contracts-filters');
  }, []);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (tempFilters.status) count++;
    if (tempFilters.startDateFrom || tempFilters.endDateFrom) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600';
      case 'blue': return 'text-blue-600';
      case 'yellow': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (color: string, isActive: boolean) => {
    if (!isActive) return 'bg-white border-gray-200';
    switch (color) {
      case 'green': return 'bg-green-50 border-green-300';
      case 'blue': return 'bg-blue-50 border-blue-300';
      case 'yellow': return 'bg-yellow-50 border-yellow-300';
      case 'red': return 'bg-red-50 border-red-300';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  return (
    <BottomSheetWrapper
      sheetId="contracts-filters"
      snapPoints={['75%']}
      enablePanDownToClose
      scrollable
    >
      <VStack className="px-4 py-4">
        {/* Header */}
        <HStack className="items-center justify-between mb-4">
          <Text className="text-lg font-semibold">Filtrar Contratos</Text>
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
                        as={filter.key === 'expiring_soon' ? AlertTriangleIcon : CalendarIcon} 
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

        {/* Contract Status Filter */}
        <VStack space="sm" className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Estado del contrato
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CONTRACT_STATUS_OPTIONS.map((option) => {
              const isActive = tempFilters.status === option.value || 
                              (!tempFilters.status && !option.value);
              return (
                <Pressable
                  key={option.key}
                  onPress={() => handleStatusFilter(option.value)}
                  className="basis-[31%]"
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
                      isActive ? getStatusColor(option.color).replace('text-', 'text-') : 'text-gray-700'
                    }`}>
                      {option.label}
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