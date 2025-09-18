import React from 'react';
import { View } from '@/components/ui/view';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { TrashIcon } from 'lucide-react-native';
import { QuantitySelector } from '@/components/inventory/QuantitySelector';
import { AssetPreview } from '@/features/assets/components/AssetPreview';
import { useFormatPrice } from '@/config/ConfigContext';
import { useNewSale } from '../../hooks/useNewSale';
import type { Product } from '@gymspace/sdk';

interface QuantityControlFooterProps {
  product: Product | undefined;
}

export const QuantityControlFooter: React.FC<QuantityControlFooterProps> = ({ product }) => {
  const { updateQuantity, removeItem, getItemQuantity, setLastSelectedProduct } = useNewSale();
  const formatPrice = useFormatPrice();

  if (!product) return null;

  const quantity = getItemQuantity(product.id);
  
  if (quantity === 0) return null;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(product.id);
      setLastSelectedProduct(null);
    } else {
      updateQuantity(product.id, newQuantity);
    }
  };

  const handleRemove = () => {
    removeItem(product.id);
    setLastSelectedProduct(null);
  };

  return (
    <View className="bg-white p-3">
      <HStack space="sm" className="items-center">
        {/* Product Image */}
        <View className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden items-center justify-center">
          {product.imageId ? (
            <AssetPreview
              assetId={product.imageId}
              size="small"
              resizeMode="cover"
              showLoading={false}
            />
          ) : (
            <View className="w-full h-full bg-gray-200" />
          )}
        </View>

        {/* Product Info and Controls */}
        <VStack className="flex-1" space="xs">
          <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
            {product.name}
          </Text>
          <HStack className="items-center justify-between">
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
              min={0}
              max={product.stock || 999}
              size="sm"
            />
            <HStack space="md" className="items-center">
              <Text className="text-sm font-semibold text-gray-900">
                {formatPrice(product.price * quantity)}
              </Text>
              <Pressable
                onPress={handleRemove}
                className="w-8 h-8 items-center justify-center rounded-full bg-red-50 active:bg-red-100"
              >
                <Icon as={TrashIcon} className="w-4 h-4 text-red-600" />
              </Pressable>
            </HStack>
          </HStack>
        </VStack>
      </HStack>
    </View>
  );
};