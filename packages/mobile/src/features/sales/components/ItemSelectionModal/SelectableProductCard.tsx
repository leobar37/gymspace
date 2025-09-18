import React, { memo, useCallback } from 'react';
import { Pressable } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { View } from '@/components/ui/view';
import { PackageIcon, CheckCircleIcon, AlertTriangleIcon } from 'lucide-react-native';
import { useFormatPrice } from '@/config/ConfigContext';
import { AssetPreview } from '@/features/assets/components/AssetPreview';
import type { Product } from '@gymspace/sdk';

interface SelectableProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  isSelected: boolean;
  selectedQuantity: number;
  isLastSelected?: boolean;
}

const SelectableProductCardComponent: React.FC<SelectableProductCardProps> = ({
  product,
  onPress,
  isSelected,
  selectedQuantity,
  isLastSelected = false,
}) => {
  const formatPrice = useFormatPrice();
  const isLowStock = product.stock !== null && product.stock <= 10;
  const isOutOfStock = product.stock !== null && product.stock <= 0;

  const handlePress = useCallback(() => {
    if (!isOutOfStock && onPress) {
      onPress(product);
    }
  }, [isOutOfStock, onPress, product]);

  return (
    <Card className={`overflow-hidden p-3 border-2 ${isLastSelected ? 'border-blue-500' : 'border-transparent'} ${isSelected && !isLastSelected ? 'bg-blue-50 border-blue-200' : ''} ${isOutOfStock ? 'opacity-60' : ''}`}>
      <Pressable
        onPress={handlePress}
        className="active:opacity-70"
        disabled={isOutOfStock}
      >
        <VStack space="xs">
          {/* Selection Indicator - Show badge only when item has quantity > 0 */}
          {selectedQuantity > 0 && (
            <View className="absolute top-0 right-0 z-10">
              <Badge size="sm" className="bg-blue-500">
                <HStack space="xs" className="items-center">
                  <Icon as={CheckCircleIcon} className="w-3 h-3 text-white" />
                  <BadgeText className="text-white text-xs">{selectedQuantity}</BadgeText>
                </HStack>
              </Badge>
            </View>
          )}

          {/* Product Image */}
          <View className="h-20 w-full bg-gray-100 rounded-lg items-center justify-center overflow-hidden">
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

          {/* Product Info */}
          <VStack space="xs" className="flex-1">
            {/* Product Name */}
            <Text className="font-medium text-gray-900 text-sm" numberOfLines={2}>
              {product.name}
            </Text>

            {/* Price and Stock */}
            <HStack className="items-center justify-between">
              <Text className="font-bold text-blue-600 text-sm">
                {formatPrice(product.price)}
              </Text>

              {/* Stock Info */}
              {product.stock !== null && (
                <HStack space="xs" className="items-center">
                  {isLowStock && (
                    <Icon 
                      as={AlertTriangleIcon} 
                      className={`${isOutOfStock ? 'text-red-500' : 'text-orange-500'} w-3 h-3`} 
                    />
                  )}
                  <Text 
                    className={`text-xs font-medium ${
                      isOutOfStock 
                        ? 'text-red-600' 
                        : isLowStock 
                        ? 'text-orange-600' 
                        : 'text-gray-600'
                    }`}
                  >
                    {product.stock}
                  </Text>
                </HStack>
              )}
            </HStack>

            {/* Out of Stock Badge */}
            {isOutOfStock && (
              <Badge variant="solid" size="sm" className="self-start bg-red-500">
                <BadgeText className="text-white text-xs">Sin Stock</BadgeText>
              </Badge>
            )}
          </VStack>
        </VStack>
      </Pressable>
    </Card>
  );
};

export const SelectableProductCard = memo(SelectableProductCardComponent);
SelectableProductCard.displayName = 'SelectableProductCard';