import React, { useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, RefreshControl, ListRenderItem } from 'react-native';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useInfiniteQuery } from '@tanstack/react-query';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Fab, FabIcon } from '@/components/ui/fab';
import { ContractsSearchAndFilters } from './ContractsSearchAndFilters';

import { ChevronLeftIcon, FileTextIcon, PlusIcon, InfoIcon } from 'lucide-react-native';

import {
  ContractStatus,
  type GetContractsParams,
  type PaginatedResponseDto,
  type Contract,
} from '@gymspace/sdk';
import { useFormatPrice } from '@/config/ConfigContext';
import { useGymSdk } from '@/providers/GymSdkProvider';

function ContractsListComponent() {
  const formatPrice = useFormatPrice();
  const { sdk } = useGymSdk();
  const { navigateWithinFeature, goBack } = useSafeNavigation();
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [filters, setFilters] = useState<GetContractsParams>({ page: 1, limit: 20 });

  // Use TanStack Query's useInfiniteQuery
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<PaginatedResponseDto<Contract>>({
    queryKey: ['contracts', 'list', filters, activeSearchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await sdk.contracts.getGymContracts({
        ...filters,
        page: pageParam as number,
        limit: 20,
        clientName: activeSearchTerm || undefined,
      });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasNext) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Flatten all pages into a single array of contracts
  const contracts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

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

  const handleFiltersChange = useCallback((newFilters: GetContractsParams) => {
    setFilters((prev: GetContractsParams) => ({ ...prev, ...newFilters }));
  }, []);

  const handleSearch = useCallback((term: string) => {
    setActiveSearchTerm(term);
  }, []);

  const handleSearchTermChange = useCallback((_term: string) => {
    // This is just for updating the local state in the search component
    // The actual search happens when handleSearch is called
  }, []);

  const handleContractPress = useCallback(
    (contractId: string) => {
      navigateWithinFeature(`/contracts/${contractId}`);
    },
    [navigateWithinFeature],
  );

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.startDateFrom || filters.endDateFrom) count++;
    if (activeSearchTerm) count++;
    return count;
  }, [filters, activeSearchTerm]);

  const renderContractItem: ListRenderItem<Contract> = useCallback(
    ({ item }) => {
      const statusInfo = getStatusBadge(item.status);
      const isFrozen = item.freezeStartDate && item.freezeEndDate;

      return (
        <Pressable
          onPress={() => handleContractPress(item.id)}
          className="bg-white p-3 rounded-xl shadow-sm"
        >
          <HStack className="justify-between items-start">
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

  const renderEmptyState = useCallback(() => {
    const hasFilters = getActiveFiltersCount() > 0;

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
  }, [getActiveFiltersCount, navigateWithinFeature]);

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
          <Button variant="outline" size="lg" onPress={() => refetch()}>
            <ButtonText className="text-base">Reintentar</ButtonText>
          </Button>
        </VStack>
      </View>
    ),
    [error, refetch],
  );

  // Show loading screen only on very first load
  if (isLoading && contracts.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <VStack className="flex-1 p-4">
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
        {/* Search and Filters Component */}
        <ContractsSearchAndFilters
          searchTerm={activeSearchTerm}
          onSearchTermChange={handleSearchTermChange}
          onSearch={handleSearch}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          activeFiltersCount={getActiveFiltersCount()}
        />

        {/* Contracts List with Native FlatList */}
        <FlatList
          data={contracts}
          renderItem={renderContractItem}
          keyExtractor={(item) => item.id}
          className="px-2 pt-2"
          contentContainerStyle={{
            flexGrow: contracts.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={
            isLoading ? renderLoadingState() : error ? renderErrorState() : renderEmptyState()
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <HStack space="sm" className="items-center">
                  <Spinner size="small" />
                  <Text className="text-gray-600 text-sm">Cargando más...</Text>
                </HStack>
              </View>
            ) : hasNextPage ? (
              <View className="py-4 items-center">
                <Text className="text-gray-500 text-sm">Desliza para cargar más</Text>
              </View>
            ) : contracts.length > 0 ? (
              <View className="py-4 items-center">
                <Text className="text-gray-500 text-sm">{contracts.length} contratos en total</Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View className="h-3" />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage}
              onRefresh={() => refetch()}
              tintColor="#3B82F6"
            />
          }
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
          removeClippedSubviews={true}
        />

        {/* Floating Action Button */}
        {contracts.length > 0 && (
          <Fab
            size="lg"
            placement="bottom right"
            onPress={() => navigateWithinFeature('/contracts/create')}
          >
            <FabIcon as={PlusIcon} />
          </Fab>
        )}
      </VStack>
    </SafeAreaView>
  );
}

const ContractsList = React.memo(ContractsListComponent);
export default ContractsList;
