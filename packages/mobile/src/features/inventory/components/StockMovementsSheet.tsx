import React from 'react';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { BottomSheetWrapper, SheetManager } from '@gymspace/sheet';
import { StockMovements } from './StockMovements';
import { useProductStockMovements } from '../hooks';
import type { Product, StockMovement } from '@gymspace/sdk';

interface StockMovementsSheetProps {
  product?: Product;
}

export const StockMovementsSheet = (props: StockMovementsSheetProps) => {
  const product = props.product;

  const { data: stockMovements = [], isLoading, refetch } = useProductStockMovements(product?.id);

  const handleMovementPress = (movement: StockMovement) => {
    // Close current sheet and open detail sheet
    SheetManager.hide('stock-movements');
    setTimeout(() => {
      SheetManager.show('stock-movement-detail', {
        movement,
      });
    }, 300);
  };

  return (
    <BottomSheetWrapper
      sheetId="stock-movements"
      snapPoints={['75%']}
      enablePanDownToClose
      scrollable
    >
      <View className="bg-white">
        <View className="px-4 py-3 border-b border-gray-100">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-2">
              <Text className="text-lg font-semibold">Movimientos de Stock</Text>
              <Text className="text-sm text-gray-600 mt-0.5">{product?.name}</Text>
            </View>
            <Button variant="solid"  size="sm" onPress={() => SheetManager.hide('stock-movements')}>
              <ButtonText>Cerrar</ButtonText>
            </Button>
          </View>
        </View>
        <View className="flex-1">
          {!!product && (
            <StockMovements
              stockMovements={stockMovements}
              isLoading={isLoading}
              onRefresh={() => refetch()}
              onItemPress={handleMovementPress}
            />
          )}
        </View>
      </View>
    </BottomSheetWrapper>
  );
};
