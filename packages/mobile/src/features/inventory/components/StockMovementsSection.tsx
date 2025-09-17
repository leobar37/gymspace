import React from 'react';
import { Pressable } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { History, ChevronRight } from 'lucide-react-native';
import { SheetManager } from '@gymspace/sheet';
import { useProductStockMovements } from '../hooks';
import type { Product } from '@gymspace/sdk';

interface StockMovementsSectionProps {
  product: Product;
}

export const StockMovementsSection = ({ product }: StockMovementsSectionProps) => {
  const { data: stockMovements = [] } = useProductStockMovements(product.id);

  const handleViewMovements = () => {
    SheetManager.show('stock-movements', {
      payload: { product }
    });
  };

  return (
    <View>
      <Pressable 
        onPress={handleViewMovements}
        className="bg-gray-50 rounded-lg p-4"
      >
        <HStack className="justify-between items-center">
          <HStack space="md" className="items-center flex-1">
            <Icon as={History} className="w-5 h-5 text-gray-600" />
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">
                Ver movimientos de stock
              </Text>
              {stockMovements.length > 0 && (
                <Text className="text-sm text-gray-500 mt-1">
                  {stockMovements.length} movimiento{stockMovements.length !== 1 ? 's' : ''} registrado{stockMovements.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </HStack>
          <Icon as={ChevronRight} className="w-5 h-5 text-gray-400" />
        </HStack>
      </Pressable>
    </View>
  );
};