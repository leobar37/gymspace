import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { Heading } from '@/components/ui/heading';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Divider } from '@/components/ui/divider';
import { Spinner } from '@/components/ui/spinner';
import { Button, ButtonText } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FAB } from '@/components/ui/fab';
import { ContractStatus } from '@gymspace/sdk';
import { useContractsController, SearchFilters } from '../controllers/contracts.controller';
import { useFormatPrice } from '@/config/ConfigContext';

interface ContractsListProps {
  filters?: SearchFilters;
  onContractPress?: (contractId: string) => void;
  hideAddButton?: boolean;
}

export const ContractsList: React.FC<ContractsListProps> = ({ 
  filters = {}, 
  onContractPress,
  hideAddButton = false 
}) => {
  const router = useRouter();
  const formatPrice = useFormatPrice();
  const { useContractsList } = useContractsController();
  const [refreshing, setRefreshing] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(filters);
  
  const { data, isLoading, refetch, isRefetching } = useContractsList(searchFilters);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleContractPress = useCallback((contractId: string) => {
    if (onContractPress) {
      onContractPress(contractId);
    } else {
      router.push(`/contracts/${contractId}`);
    }
  }, [onContractPress, router]);

  const handleAddPress = useCallback(() => {
    router.push('/contracts/create');
  }, [router]);

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


  const renderContractItem = useCallback(({ item }: { item: any }) => {
    const statusInfo = getStatusBadge(item.status);
    const isFrozen = item.freezeStartDate && item.freezeEndDate;
    
    return (
      <Pressable
        onPress={() => handleContractPress(item.id)}
        className="mb-3"
      >
        <Card>
          <CardContent className="p-4">
            <HStack className="justify-between items-start mb-2">
              <VStack className="flex-1">
                <Text className="text-sm text-gray-500 mb-1">
                  Contrato #{item.contractNumber}
                </Text>
                <Heading size="sm" className="mb-1">
                  {item.gymClient?.name || 'Cliente'}
                </Heading>
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

            <Divider className="my-3" />

            <VStack className="gap-2">
              <HStack className="justify-between">
                <Text className="text-sm text-gray-500">Vigencia:</Text>
                <Text className="text-sm font-medium">
                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </Text>
              </HStack>

              <HStack className="justify-between">
                <Text className="text-sm text-gray-500">Precio final:</Text>
                <Text className="text-sm font-medium">
                  {formatPrice(item.finalPrice)}
                </Text>
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
          </CardContent>
        </Card>
      </Pressable>
    );
  }, [handleContractPress]);

  const renderEmpty = () => (
    <Box className="flex-1 justify-center items-center p-8">
      <Text className="text-gray-500 text-center mb-4">
        No hay contratos registrados
      </Text>
      {!hideAddButton && (
        <Button onPress={handleAddPress}>
          <ButtonText>Crear primer contrato</ButtonText>
        </Button>
      )}
    </Box>
  );

  const renderStatusFilter = () => {
    const statuses = [
      { value: undefined, label: 'Todos' },
      { value: ContractStatus.ACTIVE, label: 'Activos' },
      { value: ContractStatus.PENDING, label: 'Pendientes' },
      { value: ContractStatus.EXPIRING_SOON, label: 'Por vencer' },
      { value: ContractStatus.EXPIRED, label: 'Vencidos' },
      { value: ContractStatus.CANCELLED, label: 'Cancelados' },
    ];

    return (
      <Box className="px-4 py-3">
        <HStack className="gap-2">
          {statuses.map((status) => {
            const isActive = searchFilters.status === status.value || 
                           (!searchFilters.status && !status.value);
            return (
              <Pressable
                key={status.label}
                onPress={() => setSearchFilters({ ...searchFilters, status: status.value })}
              >
                <Badge
                  action={isActive ? 'info' : 'muted'}
                  variant={isActive ? 'solid' : 'outline'}
                >
                  <BadgeText>{status.label}</BadgeText>
                </Badge>
              </Pressable>
            );
          })}
        </HStack>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
        <Text className="text-gray-500 mt-4">Cargando contratos...</Text>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-gray-50">
      {renderStatusFilter()}
      
      <FlatList
        data={data?.data || []}
        renderItem={renderContractItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 100,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {!hideAddButton && data?.data && data.data.length > 0 && (
        <FAB
          onPress={handleAddPress}
          placement="bottom right"
          renderInPortal={false}
          size="md"
        />
      )}
    </Box>
  );
};