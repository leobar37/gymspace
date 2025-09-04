import { ServicesList } from '@/components/inventory/services';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
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

export default function ServicesScreen() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, refetch } = useProducts({
    type: PRODUCT_TYPES.SERVICE,
    search: searchTerm || undefined,
    limit: 50,
    page: 1,
  });

  const services = data?.items || [];

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
            <HStack className="items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">Servicios</Text>
              <Button size="sm" onPress={handleNewService}>
                <ButtonIcon as={PlusIcon} className="mr-1" />
                <ButtonText>Nuevo</ButtonText>
              </Button>
            </HStack>

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

            {/* Stats */}
            <HStack space="md" className="mt-2">
              <View className="flex-1 bg-blue-50 rounded-lg p-3">
                <Text className="text-xs text-blue-600 font-medium">Total Servicios</Text>
                <Text className="text-lg font-bold text-blue-700">{services.length}</Text>
              </View>
              <View className="flex-1 bg-green-50 rounded-lg p-3">
                <Text className="text-xs text-green-600 font-medium">Activos</Text>
                <Text className="text-lg font-bold text-green-700">
                  {services.filter((s) => s.status === 'active').length}
                </Text>
              </View>
              <View className="flex-1 bg-gray-100 rounded-lg p-3">
                <Text className="text-xs text-gray-600 font-medium">Inactivos</Text>
                <Text className="text-lg font-bold text-gray-700">
                  {services.filter((s) => s.status === 'inactive').length}
                </Text>
              </View>
            </HStack>
          </VStack>
        </View>

        {/* Services List */}
        <ServicesList
          services={services}
          onServicePress={handleServicePress}
          isLoading={isLoading}
          onRefresh={refetch}
          numColumns={2}
        />
      </VStack>
    </SafeAreaView>
  );
}
