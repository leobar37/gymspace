import { SupplierCard } from '@/components/suppliers/SupplierCard';
import { AlertIcon, AlertText, Alert as UIAlert } from '@/components/ui/alert';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { useSuppliers } from '@/features/suppliers/controllers/suppliers.controller';
import { useDataSearch } from '@/hooks/useDataSearch';
import type { Supplier } from '@gymspace/sdk';
import { router } from 'expo-router';
import { ArrowLeftIcon, BuildingIcon, InfoIcon, PlusIcon, SearchIcon } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SuppliersScreen() {
  const {
    data: suppliers,
    isLoading,
    isError,
    error,
    refetch,
  } = useSuppliers({});

  // Use the new search hook
  const {
    searchInput,
    setSearchInput,
    filteredData: filteredSuppliers,
    clearSearch: handleClearSearch,
    hasSearch,
    resultCount,
  } = useDataSearch<Supplier>({
    data: suppliers?.data,
    searchFields: (supplier) => [
      supplier.name,
      supplier.email || '',
      supplier.phone || '',
    ],
    searchPlaceholder: 'Buscar proveedores...',
  });

  const handleSupplierPress = useCallback((supplier: Supplier) => {
    router.push(`/suppliers/${supplier.id}`);
  }, []);

  const handleAddSupplier = useCallback(() => {
    router.push('/suppliers/create');
  }, []);

  // Remove pagination as we're loading all suppliers locally
  // Local search doesn't need pagination

  const renderSupplierCard = useCallback(
    ({ item }: { item: Supplier }) => (
      <SupplierCard supplier={item} onPress={handleSupplierPress} showDetails={true} />
    ),
    [handleSupplierPress],
  );

  const renderHeader = useCallback(
    () => (
      <VStack space="md">
        {/* Back Button and Title */}
        <HStack className="items-center">
          <Button variant="link" size="sm" onPress={() => router.back()}>
            <Icon as={ArrowLeftIcon} className="w-5 h-5 text-gray-600" />
          </Button>
          <Text className="text-xl font-semibold text-gray-900">Proveedores</Text>
        </HStack>

        {/* Search Bar */}
        <HStack space="sm" className="items-center">
          <VStack className="flex-1">
            <Input className="flex-1">
              <Icon as={SearchIcon} className="absolute left-3 top-3 w-4 h-4 text-gray-400 z-10" />
              <InputField
                placeholder="Buscar proveedores..."
                value={searchInput}
                onChangeText={setSearchInput}
                returnKeyType="search"
                className="pl-10"
              />
            </Input>
          </VStack>

          {searchInput && (
            <Button variant="outline" size="sm" onPress={handleClearSearch}>
              <ButtonText className="text-red-600">Limpiar</ButtonText>
            </Button>
          )}
        </HStack>

        {/* Results Summary */}
        {filteredSuppliers && (
          <Text className="text-sm text-gray-600">
            {resultCount} proveedor{resultCount !== 1 ? 'es' : ''}{' '}
            encontrado{resultCount !== 1 ? 's' : ''}
          </Text>
        )}
      </VStack>
    ),
    [searchInput, resultCount, handleClearSearch],
  );

  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;

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
                : 'Comienza agregando tu primer proveedor'}
            </Text>
          </VStack>

          {!hasSearch && (
            <Button onPress={handleAddSupplier}>
              <Icon as={PlusIcon} className="w-4 h-4 mr-2" />
              <ButtonText>Agregar Proveedor</ButtonText>
            </Button>
          )}
        </VStack>
      </View>
    );
  }, [isLoading, hasSearch, handleAddSupplier]);

  // No footer needed for local search

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
            <Button variant="outline" onPress={() => refetch()} className="mt-4">
              <ButtonText>Reintentar</ButtonText>
            </Button>
          </View>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        <FlatList
          data={filteredSuppliers}
          renderItem={renderSupplierCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 80,
            flexGrow: filteredSuppliers.length === 0 ? 1 : undefined,
          }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3B82F6" />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
        />

        {/* Floating Action Button - Only show when there are suppliers */}
        {suppliers?.data && suppliers.data.length > 0 && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
            }}
          >
            <Pressable
              onPress={handleAddSupplier}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#6366f1',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Icon as={PlusIcon} className="text-white" size="lg" />
            </Pressable>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}
