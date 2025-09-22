import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { ServiceCard } from './ServiceCard';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Icon } from '@/components/ui/icon';
import { WrenchIcon } from 'lucide-react-native';
import type { Product } from '@gymspace/sdk';

interface ServicesListProps {
  services: Product[];
  onServicePress?: (service: Product) => void;
  onServiceLongPress?: (service: Product) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
  numColumns?: number;
}

export const ServicesList: React.FC<ServicesListProps> = ({
  services,
  onServicePress,
  onServiceLongPress,
  isLoading = false,
  onRefresh,
  compact = false,
  numColumns = 2,
}) => {
  const renderService = ({ item }: { item: Product }) => (
    <View className={numColumns > 1 ? 'flex-1 p-1' : 'px-4 pb-2'}>
      <ServiceCard
        service={item}
        onPress={onServicePress}
        onLongPress={onServiceLongPress}
        compact={compact}
      />
    </View>
  );

  const renderEmptyState = () => (
    <VStack className="flex-1 items-center justify-center py-12">
      <Icon as={WrenchIcon} className="w-16 h-16 text-gray-300 mb-4" />
      <Text className="text-gray-500 text-center">
        No hay servicios disponibles
      </Text>
      <Text className="text-gray-400 text-sm text-center mt-1">
        Agrega servicios desde el panel de administración
      </Text>
    </VStack>
  );

  return (
    <FlatList
      data={services}
      renderItem={renderService}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={{ 
        paddingVertical: 1,
        flexGrow: services.length === 0 ? 1 : undefined,
      }}
      ListEmptyComponent={renderEmptyState}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
};