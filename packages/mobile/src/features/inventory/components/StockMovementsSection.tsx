import React from 'react';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { History, ChevronRight } from 'lucide-react-native';
import { SheetManager } from 'react-native-actions-sheet';
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
    <View className="bg-white rounded-lg p-4 shadow-sm">
      <Button 
        variant="outline" 
        onPress={handleViewMovements}
        className="flex-row justify-between items-center"
      >
        <View className="flex-row items-center gap-3">
          <History size={20} className="text-gray-600" />
          <Text className="text-base font-medium text-gray-700">
            Ver movimientos de stock
          </Text>
        </View>
        <ChevronRight size={16} className="text-gray-400" />
      </Button>
      
      {stockMovements.length > 0 && (
        <Text className="text-sm text-gray-500 mt-2 text-center">
          {stockMovements.length} movimiento{stockMovements.length !== 1 ? 's' : ''} registrado{stockMovements.length !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
};