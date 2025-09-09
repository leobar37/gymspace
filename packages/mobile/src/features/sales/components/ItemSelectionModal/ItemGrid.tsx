import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import { View } from '@/components/ui/view';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { ProductCard } from '@/components/inventory/ProductCard';
import { ServiceCard } from '@/components/inventory/services';
import { PackageIcon, WrenchIcon } from 'lucide-react-native';
import type { Product } from '@gymspace/sdk';
import type { ItemTab } from '../../types';

interface ItemGridProps {
  items: Product[];
  type: ItemTab;
  loading: boolean;
  onItemPress: (item: Product) => void;
}

export const ItemGrid: React.FC<ItemGridProps> = ({ items, type, loading, onItemPress }) => {
  const renderProductCard = useCallback(
    ({ item }: { item: Product }) => (
      <View className="w-1/2 p-1">
        <ProductCard product={item} onPress={onItemPress} compact={true} showStock={true} />
      </View>
    ),
    [onItemPress]
  );

  const renderServiceCard = useCallback(
    ({ item }: { item: Product }) => (
      <View className="w-1/2 p-1">
        <ServiceCard service={item} onPress={onItemPress} compact={true} />
      </View>
    ),
    [onItemPress]
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner size="large" />
        <Text className="text-gray-600 mt-2">
          Cargando {type === 'products' ? 'productos' : 'servicios'}...
        </Text>
      </View>
    );
  }

  const EmptyComponent = () => (
    <View className="flex-1 items-center justify-center py-12">
      <Icon 
        as={type === 'products' ? PackageIcon : WrenchIcon} 
        className="w-16 h-16 text-gray-300 mb-4" 
      />
      <Text className="text-gray-600 text-center">
        No hay {type === 'products' ? 'productos' : 'servicios'} disponibles
      </Text>
    </View>
  );

  return (
    <FlatList
      data={items}
      renderItem={type === 'products' ? renderProductCard : renderServiceCard}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={EmptyComponent}
    />
  );
};