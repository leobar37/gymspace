import React from 'react';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ShoppingCartIcon } from 'lucide-react-native';
import { useFormatPrice } from '@/config/ConfigContext';
import type { Sale } from '@gymspace/sdk';

interface ProductsListProps {
  sale: Sale;
}

export function ProductsList({ sale }: ProductsListProps) {
  const formatPrice = useFormatPrice();
  const totalQuantity = sale.saleItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  return (
    <Card className="bg-white border border-gray-200">
      <VStack space="md" className="p-4">
        <HStack className="justify-between items-center">
          <Text className="text-lg font-semibold text-gray-900">
            Productos Vendidos
          </Text>
          <Text className="text-sm text-gray-600">
            {sale.saleItems?.length || 0} productos ({totalQuantity} unidades)
          </Text>
        </HStack>
        
        {sale.saleItems && sale.saleItems.length > 0 ? (
          <VStack space="sm">
            {sale.saleItems.map((item: any, index: number) => (
              <Card key={index} className="bg-gray-50 border-gray-200">
                <HStack className="justify-between items-center p-3">
                  <VStack className="flex-1">
                    <Text className="text-base font-medium text-gray-900">
                      {item.product?.name || 'Producto'}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </Text>
                  </VStack>
                  
                  <Text className="text-base font-semibold text-gray-900">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </Text>
                </HStack>
              </Card>
            ))}
          </VStack>
        ) : (
          <HStack space="sm" className="items-center justify-center py-4">
            <Icon as={ShoppingCartIcon} className="w-6 h-6 text-gray-400" />
            <Text className="text-gray-600">
              No se encontraron productos
            </Text>
          </HStack>
        )}
      </VStack>
    </Card>
  );
}