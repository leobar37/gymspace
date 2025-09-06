import { ServicesList } from '@/components/inventory/services';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { useProducts } from '@/features/products/hooks/useProducts';
import { PRODUCT_TYPES } from '@/shared/constants';
import type { Product } from '@gymspace/sdk';
import { router } from 'expo-router';
import { PlusIcon, SearchIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable } from 'react-native';

export default function ServicesScreen() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all services at once (no pagination, no API search)
  const { data, isLoading, refetch } = useProducts({
    type: PRODUCT_TYPES.SERVICE,
    limit: 9999, // Get all services
    page: 1,
  });

  const allServices = data?.items || [];

  // Filter services locally based on search term
  const filteredServices = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return allServices;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return allServices.filter((service) => {
      // Search in name and description
      const nameMatch = service.name?.toLowerCase().includes(searchLower);
      const descriptionMatch = service.description?.toLowerCase().includes(searchLower);
      const skuMatch = service.sku?.toLowerCase().includes(searchLower);

      return nameMatch || descriptionMatch || skuMatch;
    });
  }, [allServices, searchTerm]);

  const handleServicePress = (service: Product) => {
    router.push(`/inventory/services/${service.id}`);
  };

  const handleNewService = () => {
    router.push('/inventory/services/new');
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
  };

  if (isLoading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Spinner size="large" />
          <Text className="text-gray-600 mt-2">Cargando servicios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <VStack className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200">
          <VStack space="sm" className="px-4 py-3">
            {/* Search Bar */}
            <Input variant="outline" size="md">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChangeText={handleSearch}
                autoCapitalize="none"
              />
            </Input>

            {/* Search Results Info */}
            {searchTerm.trim() && (
              <Text className="text-sm text-gray-600">
                {filteredServices.length} de {allServices.length} servicios encontrados
              </Text>
            )}

            {/* Stats */}
            <HStack space="md" className='-mt-4'>
              <View className="flex-1 bg-blue-50 rounded-lg p-3">
                <Text className="text-xs text-blue-600 font-medium">Total Servicios</Text>
                <Text className="text-lg font-bold text-blue-700">{allServices.length}</Text>
              </View>
              <View className="flex-1 bg-green-50 rounded-lg p-3">
                <Text className="text-xs text-green-600 font-medium">Activos</Text>
                <Text className="text-lg font-bold text-green-700">
                  {allServices.filter((s) => s.status === 'active').length}
                </Text>
              </View>
              <View className="flex-1 bg-gray-100 rounded-lg p-3">
                <Text className="text-xs text-gray-600 font-medium">Inactivos</Text>
                <Text className="text-lg font-bold text-gray-700">
                  {allServices.filter((s) => s.status === 'inactive').length}
                </Text>
              </View>
            </HStack>
          </VStack>
        </View>

        {/* Services List */}
        <ServicesList
          services={filteredServices}
          onServicePress={handleServicePress}
          isLoading={isLoading}
          onRefresh={refetch}
          numColumns={2}
        />

        {/* Floating Action Button */}
        <Pressable
          onPress={handleNewService}
          className="absolute bottom-6 right-6 bg-blue-600 rounded-full p-4 active:bg-blue-700"
          style={{
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
        >
          <Icon as={PlusIcon} className="w-6 h-6 text-white" />
        </Pressable>
      </VStack>
    </SafeAreaView>
  );
}
