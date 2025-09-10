import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import { View } from '@/components/ui/view';
import { CartItem } from '@/components/inventory/CartItem';
import { useNewSale } from '../hooks/useNewSale';
import type { CartItem as CartItemType } from '../types';

export const CartItemList: React.FC = () => {
  const { items, updateQuantity, removeItem } = useNewSale();

  const renderCartItem = useCallback(
    ({ item }: { item: CartItemType }) => (
      <CartItem
        item={item}
        onQuantityChange={(quantity) => updateQuantity(item.product.id, quantity)}
        onRemove={() => removeItem(item.product.id)}
      />
    ),
    [],
  );

  return (
    <FlatList
      data={items}
      renderItem={renderCartItem}
      keyExtractor={(item) => item.product.id}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View className="h-1" />}
    />
  );
};
