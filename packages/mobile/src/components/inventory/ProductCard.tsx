import React from 'react';
import { Pressable } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { View } from '@/components/ui/view';
import { PackageIcon, AlertTriangleIcon } from 'lucide-react-native';
import { useFormatPrice } from '@/config/ConfigContext';
import { AssetPreview } from '@/features/assets/components/AssetPreview';
import type { Product } from '@gymspace/sdk';

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  onLongPress?: (product: Product) => void;
  showStock?: boolean;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onLongPress,
  showStock = true,
  compact = false,
}) => {
  const formatPrice = useFormatPrice();
  const isLowStock = product.stock <= 10;
  const isOutOfStock = product.stock <= 0;
  const isInactive = product.status === 'inactive';

  const handlePress = () => {
    onPress?.(product);
  };

  const handleLongPress = () => {
    onLongPress?.(product);
  };

  return (
    <Card className={`overflow-hidden ${compact ? 'p-3' : 'p-4'} ${isInactive ? 'opacity-60' : ''}`}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        className="active:opacity-70"
      >
        <VStack space={compact ? 'xs' : 'sm'}>
          {/* Product Image */}
          <View className={`${compact ? 'h-20' : 'h-24'} w-full bg-gray-100 rounded-lg items-center justify-center overflow-hidden`}>
            {product.imageId ? (
              <AssetPreview
                assetId={product.imageId}
                size="small"
                resizeMode="cover"
                showLoading={false}
              />
            ) : (
              <Icon 
                as={PackageIcon} 
                className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} text-gray-400`} 
              />
            )}
          </View>

          {/* Product Info */}
          <VStack space="xs" className="flex-1">
            {/* Category Badge */}
            {product.category && !compact && (
              <Badge 
                variant="outline"
                size="sm"
                className="self-start"
                style={{ backgroundColor: product.category.color + '20' || '#f3f4f6' }}
              >
                <BadgeText className="text-xs" style={{ color: product.category.color || '#6b7280' }}>
                  {product.category.name}
                </BadgeText>
              </Badge>
            )}

            {/* Product Name */}
            <Text 
              className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}
              numberOfLines={2}
            >
              {product.name}
            </Text>

            {/* Description */}
            {product.description && !compact && (
              <Text 
                className="text-xs text-gray-600" 
                numberOfLines={2}
              >
                {product.description}
              </Text>
            )}

            {/* Price and Stock Row */}
            <HStack className="items-center justify-between mt-1">
              {/* Price */}
              <Text className={`font-bold text-blue-600 ${compact ? 'text-sm' : 'text-base'}`}>
                {formatPrice(product.price)}
              </Text>

              {/* Stock Info */}
              {showStock && (
                <HStack space="xs" className="items-center">
                  {isLowStock && (
                    <Icon 
                      as={AlertTriangleIcon} 
                      className={`${isOutOfStock ? 'text-red-500' : 'text-orange-500'} ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} 
                    />
                  )}
                  <Text 
                    className={`${compact ? 'text-xs' : 'text-sm'} font-medium ${
                      isOutOfStock 
                        ? 'text-red-600' 
                        : isLowStock 
                        ? 'text-orange-600' 
                        : 'text-gray-600'
                    }`}
                  >
                    Stock: {product.stock}
                  </Text>
                </HStack>
              )}
            </HStack>

            {/* Status Indicators */}
            {(isOutOfStock || isInactive) && (
              <Badge 
                variant="solid"
                size="sm"
                className={`self-start ${
                  isInactive ? 'bg-gray-500' : isOutOfStock ? 'bg-red-500' : 'bg-orange-500'
                }`}
              >
                <BadgeText className="text-white text-xs">
                  {isInactive ? 'Inactivo' : isOutOfStock ? 'Sin Stock' : 'Stock Bajo'}
                </BadgeText>
              </Badge>
            )}
          </VStack>
        </VStack>
      </Pressable>
    </Card>
  );
};