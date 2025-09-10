import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import { View } from '@/components/ui/view';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { SelectableProductCard } from './SelectableProductCard';
import { SelectableServiceCard } from './SelectableServiceCard';
import { PackageIcon, WrenchIcon } from 'lucide-react-native';
import type { Product } from '@gymspace/sdk';
import type { ItemTab } from '../../types';
import { useNewSale } from '../../hooks/useNewSale';

interface ItemGridProps {
  items: Product[];
  type: ItemTab;
  loading: boolean;
  onItemPress: (item: Product) => void;
}

export const ItemGrid: React.FC<ItemGridProps> = ({ items, type, loading, onItemPress }) => {
  const { isInCart, getItemQuantity } = useNewSale();
  
  const renderProductCard = useCallback(
    ({ item }: { item: Product }) => {
      const inCart = isInCart(item.id);
      const quantity = getItemQuantity(item.id);
      
      return (
        <View className="w-1/2 p-1">
          <SelectableProductCard 
            product={item} 
            onPress={onItemPress}
            isSelected={inCart}
            selectedQuantity={quantity}
          />
        </View>
      );
    },
    [onItemPress, isInCart, getItemQuantity]
  );

  const renderServiceCard = useCallback(
    ({ item }: { item: Product }) => {
      const inCart = isInCart(item.id);
      const quantity = getItemQuantity(item.id);
      
      return (
        <View className="w-1/2 p-1">
          <SelectableServiceCard 
            service={item} 
            onPress={onItemPress}
            isSelected={inCart}
            selectedQuantity={quantity}
          />
        </View>
      );
    },
    [onItemPress, isInCart, getItemQuantity]
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