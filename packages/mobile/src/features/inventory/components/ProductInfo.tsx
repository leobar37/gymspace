import React from 'react';
import { Badge, BadgeText } from '@/components/ui/badge';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { TagIcon } from 'lucide-react-native';
import type { Product } from '@gymspace/sdk';

interface ProductInfoProps {
  product: Product;
  isInactive: boolean;
  isOutOfStock: boolean;
  isLowStock: boolean;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({ 
  product, 
  isInactive,
  isOutOfStock,
  isLowStock 
}) => {
  return (
    <VStack space="sm" className="p-4">
      {/* Product Name and Status */}
      <HStack className="justify-between items-start">
        <VStack className="flex-1">
          <Text className="text-2xl font-bold text-gray-900">
            {product.name}
          </Text>
          {product.category && (
            <HStack space="xs" className="items-center mt-1">
              <Icon as={TagIcon} className="w-4 h-4 text-gray-500" />
              <Badge
                size="sm"
                style={{ backgroundColor: product.category.color + '20' || '#f3f4f6' }}
              >
                <BadgeText style={{ color: product.category.color || '#6b7280' }}>
                  {product.category.name}
                </BadgeText>
              </Badge>
            </HStack>
          )}
        </VStack>

        <VStack space="xs" className="items-end">
          <Badge
            className={isInactive ? 'bg-gray-500' : 'bg-green-100'}
          >
            <BadgeText className={isInactive ? 'text-white' : 'text-green-700'}>
              {isInactive ? 'Inactivo' : 'Activo'}
            </BadgeText>
          </Badge>

          {isOutOfStock && (
            <Badge className="bg-red-500">
              <BadgeText className="text-white">Sin Stock</BadgeText>
            </Badge>
          )}

          {!isOutOfStock && isLowStock && (
            <Badge className="bg-orange-500">
              <BadgeText className="text-white">Stock Bajo</BadgeText>
            </Badge>
          )}
        </VStack>
      </HStack>

      {/* Description */}
      {product.description && (
        <Text className="text-gray-600">
          {product.description}
        </Text>
      )}
    </VStack>
  );
};