import React from 'react';
import { Pressable } from 'react-native';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { View } from '@/components/ui/view';
import { TrashIcon, PackageIcon } from 'lucide-react-native';
import { QuantitySelector } from './QuantitySelector';
import { AssetPreview } from '@/features/assets/components/AssetPreview';
import { useFormatPrice } from '@/config/ConfigContext';
import type { CartItem as CartItemType } from '@/features/sales/types';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
  const formatPrice = useFormatPrice();
  const { product, quantity, total } = item;

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <HStack space="md" className="p-4">
        {/* Product Image */}
        <View className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden items-center justify-center">
          {product.imageId ? (
            <AssetPreview
              assetId={product.imageId}
              size="small"
              resizeMode="cover"
              showLoading={false}
            />
          ) : (
            <Icon as={PackageIcon} className="w-8 h-8 text-gray-400" />
          )}
        </View>

        {/* Product Info & Controls */}
        <VStack className="flex-1" space="xs">
          {/* Product Name & Price */}
          <HStack className="justify-between items-start">
            <VStack className="flex-1 mr-2">
              <Text className="text-gray-900 font-medium text-sm" numberOfLines={2}>
                {product.name}
              </Text>
              <Text className="text-gray-600 text-xs">
                {formatPrice(product.price)} c/u
              </Text>
            </VStack>
            
            {/* Remove Button */}
            <Pressable
              onPress={onRemove}
              className="w-8 h-8 items-center justify-center rounded-full bg-red-50 active:bg-red-100"
            >
              <Icon as={TrashIcon} className="w-4 h-4 text-red-600" />
            </Pressable>
          </HStack>

          {/* Quantity Controls & Total */}
          <HStack className="justify-between items-center">
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={onQuantityChange}
              min={1}
              max={product.stock || 999}
              size="sm"
            />
            
            <Text className="text-gray-900 font-semibold">
              {formatPrice(total)}
            </Text>
          </HStack>

          {/* Stock Warning */}
          {product.stock && product.stock < 10 && (
            <Text className="text-orange-600 text-xs">
              Solo quedan {product.stock} en stock
            </Text>
          )}
        </VStack>
      </HStack>
    </Card>
  );
}