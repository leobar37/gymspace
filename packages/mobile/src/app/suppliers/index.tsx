import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { View } from '@/components/ui/view';
import { Spinner } from '@/components/ui/spinner';
import { Icon } from '@/components/ui/icon';
import { Alert as UIAlert, AlertIcon, AlertText } from '@/components/ui/alert';
import { 
  PlusIcon, 
  SearchIcon,
  BuildingIcon,
  InfoIcon,
  ArrowLeftIcon
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useSuppliers } from '@/hooks/useSuppliers';
import { SupplierCard } from '@/components/suppliers/SupplierCard';
import type { Supplier, SearchSuppliersParams } from '@gymspace/sdk';

export default function SuppliersScreen() {
  const [filters, setFilters] = useState<SearchSuppliersParams>({ page: 1, limit: 20 });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch
  } = useSuppliers({
    ...filters,
    search: searchTerm || undefined,
  });

  const handleSearch = useCallback(() => {
    setSearchTerm(searchInput.trim());
    setFilters(prev => ({
      ...prev,
      page: 1, // Reset to first page when searching
    }));
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
    setFilters(prev => ({
      ...prev,
      page: 1,
    }));
  }, []);

  const handleSupplierPress = useCallback((supplier: Supplier) => {
    router.push(`/suppliers/${supplier.id}`);
  }, []);

  const handleAddSupplier = useCallback(() => {
    router.push('/suppliers/create');
  }, []);

  const handleLoadMore = useCallback(() => {
    if (data?.hasNextPage && !isFetching) {
      setFilters(prev => ({
        ...prev,
        page: (prev.page || 1) + 1,
      }));
    }
  }, [data?.hasNextPage, isFetching]);

  const renderSupplierCard = useCallback(({ item }: { item: Supplier }) => (
    <SupplierCard
      supplier={item}
      onPress={handleSupplierPress}
      showDetails={true}
    />
  ), [handleSupplierPress]);

  const renderHeader = useCallback(() => (
    <VStack space="md">
      {/* Back Button and Title */}
      <HStack className="justify-between items-center">
        <HStack space="md" className="items-center flex-1">
          <Button
            variant="link"
            size="sm"
            onPress={() => router.back()}
          >
            <Icon as={ArrowLeftIcon} className="w-5 h-5 text-gray-600" />
          </Button>
          <Text className="text-xl font-semibold text-gray-900">
            Proveedores
          </Text>
        </HStack>
        
        <Button
          size="sm"
          variant="solid"
          onPress={handleAddSupplier}
        >
          <Icon as={PlusIcon} className="w-4 h-4 mr-2" />
          <ButtonText>Agregar</ButtonText>
        </Button>
      </HStack>

      {/* Search Bar */}
      <HStack space="sm" className="items-center">
        <VStack className="flex-1">
          <Input className="flex-1">
            <InputField
              placeholder="Buscar proveedores..."
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </Input>
        </VStack>
        
        <Button
          variant="outline"
          size="sm"
          onPress={handleSearch}
        >
          <Icon as={SearchIcon} className="w-4 h-4 text-gray-600" />
        </Button>
        
        {searchTerm && (
          <Button
            variant="outline"
            size="sm"
            onPress={handleClearSearch}
          >
            <ButtonText className="text-red-600">Limpiar</ButtonText>
          </Button>
        )}
      </HStack>
      
      {/* Results Summary */}
      {data && (
        <HStack className="justify-between items-center">
          <Text className="text-sm text-gray-600">
            {data.total} proveedor{data.total !== 1 ? 'es' : ''} encontrado{data.total !== 1 ? 's' : ''}
          </Text>
          {data.totalPages > 1 && (
            <Text className="text-sm text-gray-500">
              Página {data.page} de {data.totalPages}
            </Text>
          )}
        </HStack>
      )}
    </VStack>
  ), [
    searchInput,
    searchTerm,
    data,
    handleSearch,
    handleClearSearch,
    handleAddSupplier,
  ]);

  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;

    const hasSearch = !!searchTerm;

    return (
      <View className="flex-1 items-center justify-center py-12 px-8">
        <VStack space="md" className="items-center">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center">
            <Icon as={BuildingIcon} className="w-10 h-10 text-gray-400" />
          </View>
          
          <VStack space="xs" className="items-center">
            <Text className="text-lg font-medium text-gray-900 text-center">
              {hasSearch ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
            </Text>
            <Text className="text-gray-600 text-center">
              {hasSearch 
                ? 'Intenta con otro término de búsqueda'
                : 'Comienza agregando tu primer proveedor'
              }
            </Text>
          </VStack>

          {!hasSearch && (
            <Button
              onPress={handleAddSupplier}
            >
              <Icon as={PlusIcon} className="w-4 h-4 mr-2" />
              <ButtonText>Agregar Proveedor</ButtonText>
            </Button>
          )}
        </VStack>
      </View>
    );
  }, [isLoading, searchTerm, handleAddSupplier]);

  const renderFooter = useCallback(() => {
    if (!isFetching || !data?.hasNextPage) return null;

    return (
      <View className="py-4 items-center">
        <HStack space="sm" className="items-center">
          <Spinner size="small" />
          <Text className="text-gray-600 text-sm">Cargando más proveedores...</Text>
        </HStack>
      </View>
    );
  }, [isFetching, data?.hasNextPage]);

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <VStack className="flex-1 p-4">
          {renderHeader()}
          <View className="flex-1 items-center justify-center">
            <UIAlert action="error" variant="solid" className="max-w-sm">
              <AlertIcon as={InfoIcon} />
              <AlertText>
                Error al cargar los proveedores: {error?.message || 'Error desconocido'}
              </AlertText>
            </UIAlert>
            <Button
              variant="outline"
              onPress={() => refetch()}
              className="mt-4"
            >
              <ButtonText>Reintentar</ButtonText>
            </Button>
          </View>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={data?.items || []}
        renderItem={renderSupplierCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: 20,
          flexGrow: data?.items?.length === 0 ? 1 : undefined,
        }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !isFetching}
            onRefresh={refetch}
            tintColor="#3B82F6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
      />
    </SafeAreaView>
  );
}