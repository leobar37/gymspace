import React from 'react';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useFormatPrice } from '@/config/ConfigContext';
import { 
  DollarSignIcon, 
  HashIcon,
  TagIcon
} from 'lucide-react-native';
import type { Product } from '@gymspace/sdk';

interface ProductStatsProps {
  product: Product;
}

export const ProductStats: React.FC<ProductStatsProps> = ({ product }) => {
  const formatPrice = useFormatPrice();
  
  const stats = [
    {
      icon: DollarSignIcon,
      label: 'Precio de Venta',
      value: formatPrice(product.price),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: TagIcon,
      label: 'Precio de Compra',
      value: product.costPrice ? formatPrice(product.costPrice) : 'No definido',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: HashIcon,
      label: 'SKU',
      value: product.sku || 'No definido',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <VStack space="lg">
        <Text className="text-lg font-semibold text-gray-900">Información del Producto</Text>
        
        <VStack space="md">
          {stats.map((stat, index) => (
            <HStack key={index} className="justify-between items-center">
              <HStack space="md" className="items-center flex-1">
                <View className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon as={stat.icon} className={`w-4 h-4 ${stat.color}`} />
                </View>
                <Text className="text-gray-600">{stat.label}</Text>
              </HStack>
              <Text className="text-lg font-semibold text-gray-900">
                {stat.value}
              </Text>
            </HStack>
          ))}
        </VStack>

        {/* Profit Margin */}
        {product.costPrice && product.price > 0 && (
          <VStack space="xs" className="pt-3">
            <HStack className="justify-between items-center">
              <Text className="text-sm text-gray-600">Margen de Ganancia</Text>
              <Text className="font-semibold text-green-600">
                {((product.price - product.costPrice) / product.price * 100).toFixed(1)}%
              </Text>
            </HStack>
            <HStack className="justify-between items-center">
              <Text className="text-sm text-gray-600">Ganancia por Unidad</Text>
              <Text className="font-semibold text-green-600">
                {formatPrice(product.price - product.costPrice)}
              </Text>
            </HStack>
          </VStack>
        )}
    </VStack>
  );
};

// Fix View import
import { View } from 'react-native';