import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SheetManager } from '@gymspace/sheet';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';

import {
  ChevronLeftIcon,
  FileTextIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  InfoIcon,
} from 'lucide-react-native';

import { ContractStatus, type GetContractsParams } from '@gymspace/sdk';
import { useFormatPrice } from '@/config/ConfigContext';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useInfiniteScroll, InfiniteScrollList } from '@/shared/pagination';

function ContractsListComponent() {
  const formatPrice = useFormatPrice();
  const { sdk } = useGymSdk();
  const { navigateWithinFeature, goBack } = useSafeNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<GetContractsParams>({ page: 1, limit: 20 });

  // Use pagination hook
  const pagination = useInfiniteScroll({
    queryKey: ['contracts', 'list', filters, searchTerm] as const,
    queryFn: async (params) => {
      // Get contracts from SDK with search parameters
      const response = await sdk.contracts.getGymContracts({
        ...filters,
        ...params,
        clientName: searchTerm || undefined,
      });

      // The response from SDK already has the correct structure with data and meta
      // No need to transform it
      return response;
    },
    limit: 20,
    enabled: true,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    prefetchNextPage: true,
  });

  const {
    allItems: contracts = [],
    state,
    isLoading,
    error,
    isFetching,
    refresh,
  } = pagination;

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return { variant: 'success' as const, text: 'Activo' };
      case ContractStatus.PENDING:
        return { variant: 'info' as const, text: 'Pendiente' };
      case ContractStatus.EXPIRING_SOON:
        return { variant: 'warning' as const, text: 'Por vencer' };
      case ContractStatus.EXPIRED:
        return { variant: 'error' as const, text: 'Vencido' };
      case ContractStatus.CANCELLED:
        return { variant: 'muted' as const, text: 'Cancelado' };
      default:
        return { variant: 'muted' as const, text: status };
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: es });
  };

  const handleFiltersChange = useCallback(
    (newFilters: GetContractsParams) => {
      setFilters((prev: GetContractsParams) => ({ ...prev, ...newFilters }));
      pagination.reset();
    },
    [pagination],
  );

  const handleSearch = useCallback(() => {
    pagination.reset();
  }, [pagination]);

  const handleOpenFilters = useCallback(() => {
    SheetManager.show('contracts-filters', {
      payload: {
        currentFilters: filters,
        onApplyFilters: handleFiltersChange,
      },
    });
  }, [filters, handleFiltersChange]);

  const handleContractPress = useCallback((contractId: string) => {
    navigateWithinFeature(`/contracts/${contractId}`);
  }, [navigateWithinFeature]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.startDateFrom || filters.endDateFrom) count++;
    if (searchTerm) count++;
    return count;
  }, [filters, searchTerm]);

  const renderContractItem = useCallback(
    ({ item }: { item: any }) => {
      const statusInfo = getStatusBadge(item.status);
      const isFrozen = item.freezeStartDate && item.freezeEndDate;

      return (
        <Pressable
          onPress={() => handleContractPress(item.id)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3"
        >
          <HStack className="justify-between items-start mb-2">
            <VStack className="flex-1">
              <Text className="text-sm text-gray-500 mb-1">Contrato #{item.contractNumber}</Text>
              <Text className="text-base font-semibold text-gray-900 mb-1">
                {item.gymClient?.name || 'Cliente'}
              </Text>
              <Text className="text-sm text-gray-600">
                {item.gymMembershipPlan?.name || 'Plan'}
              </Text>
            </VStack>
            <VStack className="items-end">
              <Badge action={statusInfo.variant} className="mb-2">
                <BadgeText>{statusInfo.text}</BadgeText>
              </Badge>
              {isFrozen && (
                <Badge action="info" size="sm">
                  <BadgeText>Congelado</BadgeText>
                </Badge>
              )}
            </VStack>
          </HStack>

          <View className="h-px bg-gray-200 my-3" />

          <VStack space="sm">
            <HStack className="justify-between">
              <Text className="text-sm text-gray-500">Vigencia:</Text>
              <Text className="text-sm font-medium">
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
              </Text>
            </HStack>

            <HStack className="justify-between">
              <Text className="text-sm text-gray-500">Precio final:</Text>
              <Text className="text-sm font-medium">{formatPrice(item.finalAmount)}</Text>
            </HStack>

            {item.discountPercentage > 0 && (
              <HStack className="justify-between">
                <Text className="text-sm text-gray-500">Descuento:</Text>
                <Text className="text-sm font-medium text-green-600">
                  {item.discountPercentage}%
                </Text>
              </HStack>
            )}

            {isFrozen && (
              <HStack className="justify-between">
                <Text className="text-sm text-gray-500">Congelado:</Text>
                <Text className="text-sm font-medium">
                  {formatDate(item.freezeStartDate)} - {formatDate(item.freezeEndDate)}
                </Text>
              </HStack>
            )}
          </VStack>
        </Pressable>
      );
    },
    [handleContractPress, formatPrice],
  );

  const renderListHeader = useCallback(() => null, []);

  const renderEmptyState = useCallback(() => {
    const hasFilters = getActiveFiltersCount() > 0;

    // Don't show empty state while fetching
    if (isFetching && contracts.length === 0) {
      return null;
    }

    return (
      <View className="flex-1 items-center justify-center py-12 px-8">
        <VStack space="lg" className="items-center">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center">
            <Icon as={FileTextIcon} className="w-12 h-12 text-gray-400" />
          </View>

          <VStack space="sm" className="items-center">
            <Text className="text-xl font-semibold text-gray-900 text-center">
              {hasFilters ? 'No se encontraron contratos' : 'No hay contratos registrados'}
            </Text>
            <Text className="text-base text-gray-600 text-center px-4">
              {hasFilters
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Los contratos aparecerán aquí una vez que crees el primer contrato'}
            </Text>
          </VStack>

          {!hasFilters && (
            <Button
              variant="solid"
              size="lg"
              onPress={() => navigateWithinFeature('/contracts/create')}
              className="mt-4"
            >
              <Icon as={FileTextIcon} className="w-5 h-5 mr-2" />
              <ButtonText className="text-base">Crear Contrato</ButtonText>
            </Button>
          )}
        </VStack>
      </View>
    );
  }, [getActiveFiltersCount, isFetching, contracts.length]);

  const renderLoadingState = useCallback(
    () => (
      <View className="flex-1 items-center justify-center py-12">
        <VStack space="lg" className="items-center">
          <Spinner size="large" />
          <Text className="text-lg text-gray-600">Cargando contratos...</Text>
        </VStack>
      </View>
    ),
    [],
  );

  const renderErrorState = useCallback(
    () => (
      <View className="flex-1 items-center justify-center px-8">
        <VStack space="lg" className="items-center">
          <Alert action="error" variant="solid" className="max-w-sm">
            <AlertIcon as={InfoIcon} size="lg" />
            <AlertText className="text-base">
              Error al cargar los contratos: {error?.message || 'Error desconocido'}
            </AlertText>
          </Alert>
          <Button variant="outline" size="lg" onPress={refresh}>
            <ButtonText className="text-base">Reintentar</ButtonText>
          </Button>
        </VStack>
      </View>
    ),
    [error, refresh],
  );

  // Show loading screen only on very first load
  if (isLoading && contracts.length === 0 && !state?.page) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <VStack className="flex-1 p-4">
          <HStack className="items-center mb-6">
            <Pressable onPress={() => goBack()} className="p-2 -ml-2 rounded-lg">
              <Icon as={ChevronLeftIcon} className="w-6 h-6 text-gray-700" />
            </Pressable>
            <Text className="text-2xl font-bold text-gray-900 ml-2">Contratos</Text>
          </HStack>
          <View className="flex-1 items-center justify-center">
            <VStack space="lg" className="items-center">
              <Spinner size="large" />
              <Text className="text-lg text-gray-600">Cargando contratos...</Text>
            </VStack>
          </View>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-gray-50">
      <VStack className="flex-1">
        {/* Fixed Header with Search */}
        <View className="bg-white shadow-sm border-b border-gray-100">
          <VStack className="p-4" space="lg">
            {/* Search Bar and Filters */}
            <HStack space="md" className="items-center">
              <View className="flex-1">
                <Input size="lg" className="bg-gray-50 border-gray-200">
                  <InputField
                    placeholder="Buscar por cliente..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    className="text-base"
                  />
                </Input>
              </View>

              <Button
                variant="outline"
                size="md"
                onPress={handleSearch}
                className="border-gray-300 px-4"
              >
                <Icon as={SearchIcon} className="w-5 h-5 text-gray-600" />
              </Button>

              <Button
                variant="outline"
                size="md"
                onPress={handleOpenFilters}
                className={`border-gray-300 px-4 ${getActiveFiltersCount() > 0 ? 'bg-blue-50 border-blue-300' : ''}`}
              >
                <HStack space="xs" className="items-center">
                  <Icon
                    as={FilterIcon}
                    className={`w-5 h-5 ${getActiveFiltersCount() > 0 ? 'text-blue-600' : 'text-gray-600'}`}
                  />
                  {getActiveFiltersCount() > 0 && (
                    <View className="bg-blue-600 rounded-full px-1.5 py-0.5 min-w-[20px]">
                      <Text className="text-xs text-white font-bold text-center">
                        {getActiveFiltersCount()}
                      </Text>
                    </View>
                  )}
                </HStack>
              </Button>
            </HStack>
          </VStack>
        </View>

        {/* Contracts List with Infinite Scroll */}
        <InfiniteScrollList
          pagination={pagination}
          renderItem={renderContractItem}
          ListHeaderComponent={renderListHeader}
          loadingComponent={renderLoadingState()}
          emptyComponent={renderEmptyState()}
          errorComponent={renderErrorState()}
          enableRefresh={true}
          onEndReachedThreshold={0.3}
          performanceConfig={{
            maxToRenderPerBatch: 10,
            windowSize: 10,
            initialNumToRender: 8,
            removeClippedSubviews: true,
          }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 20,
          }}
          ItemSeparatorComponent={() => <View className="h-3" />}
        />

        {/* Floating Action Button for New Contract */}
        <View className="absolute bottom-6 right-4">
          <Pressable
            onPress={() => navigateWithinFeature('/contracts/create')}
            className="bg-blue-600 rounded-full shadow-2xl active:bg-blue-700"
          >
            {contracts.length > 0 ? (
              // Compact FAB when there are contracts
              <View className="w-14 h-14 items-center justify-center">
                <Icon as={PlusIcon} className="text-white w-7 h-7" />
              </View>
            ) : null}
          </Pressable>
        </View>
      </VStack>
    </SafeAreaView>
  );
}

const ContractsList = React.memo(ContractsListComponent);
export default ContractsList;
