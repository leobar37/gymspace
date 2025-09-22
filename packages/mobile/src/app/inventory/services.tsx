import { ServicesList } from '@/components/inventory/services';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Fab, FabIcon } from '@/components/ui/fab';
import { useServices, useServicesFilter } from '@/features/products/hooks';
import type { Product } from '@gymspace/sdk';
import { router } from 'expo-router';
import { PlusIcon, SearchIcon } from 'lucide-react-native';
import React from 'react';

export default function ServicesScreen() {
  // Load all services (up to 100)
  const {
    data: services = [],
    isLoading,
    refetch,
  } = useServices({
    enabled: true,
  });

  // Use local filtering hook for services
  const { filteredServices, filters, searchInput, setSearchInput } = useServicesFilter({
    services,
  });

  const handleServicePress = (service: Product) => {
    router.push(`/inventory/services/${service.id}`);
  };

  const handleNewService = () => {
    router.push('/inventory/services/new');
  };

  if (isLoading && services.length === 0) {
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
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="flex-1">
        {/* Header */}
        <VStack space="sm" className="px-4 pb-3">
          {/* Search Bar */}
          <Input variant="outline" size="md">
            <InputSlot className="pl-3">
              <InputIcon as={SearchIcon} />
            </InputSlot>
            <InputField
              placeholder="Buscar servicios..."
              value={searchInput}
              onChangeText={setSearchInput}
              autoCapitalize="none"
            />
          </Input>

          {/* Search Results Info */}
          {filters.search && (
            <Text className="text-sm text-gray-600">
              {filteredServices.length} de {services.length} servicios encontrados
            </Text>
          )}

          {/* Stats */}
          <HStack space="md" className="mt-2">
            <View className="flex-1 bg-blue-50 rounded-lg p-3">
              <Text className="text-xs text-blue-600 font-medium">Total Servicios</Text>
              <Text className="text-lg font-bold text-blue-700">{services.length}</Text>
            </View>
            <View className="flex-1 bg-green-50 rounded-lg p-3">
              <Text className="text-xs text-green-600 font-medium">Activos</Text>
              <Text className="text-lg font-bold text-green-700">
                {services.filter((s: Product) => s.status === 'active').length}
              </Text>
            </View>
            <View className="flex-1 bg-gray-100 rounded-lg p-3">
              <Text className="text-xs text-gray-600 font-medium">Inactivos</Text>
              <Text className="text-lg font-bold text-gray-700">
                {services.filter((s: Product) => s.status === 'inactive').length}
              </Text>
            </View>
          </HStack>
        </VStack>
        {/* Services List */}
        <ServicesList
          compact
          services={filteredServices}
          onServicePress={handleServicePress}
          isLoading={isLoading}
          onRefresh={refetch}
          numColumns={2}
        />

        {/* Floating Action Button */}
        <Fab onPress={handleNewService} size="lg" placement="bottom right">
          <FabIcon as={PlusIcon} />
        </Fab>
      </VStack>
    </SafeAreaView>
  );
}
