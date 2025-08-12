import React from 'react';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { useProductDetailStore } from '../stores/product-detail.store';
import { 
  PackageIcon, 
  MinusIcon, 
  PlusIcon,
  AlertTriangleIcon 
} from 'lucide-react-native';
import type { Product } from '@gymspace/sdk';

interface StockAdjustmentProps {
  product: Product;
  isLowStock: boolean;
  onApplyAdjustment: (adjustment: number) => Promise<void>;
  isUpdating: boolean;
}

export const StockAdjustment: React.FC<StockAdjustmentProps> = ({ 
  product,
  isLowStock,
  onApplyAdjustment,
  isUpdating
}) => {
  const {
    showStockAdjustment,
    stockAdjustment,
    setShowStockAdjustment,
    incrementStock,
    decrementStock,
    resetStockAdjustment
  } = useProductDetailStore();

  const handleApply = async () => {
    if (stockAdjustment !== 0) {
      await onApplyAdjustment(stockAdjustment);
      resetStockAdjustment();
    }
  };

  const handleCancel = () => {
    resetStockAdjustment();
  };

  const newStock = product.stock + stockAdjustment;
  const adjustmentColor = stockAdjustment > 0 ? 'text-green-600' : stockAdjustment < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <Card className="bg-white border border-gray-200">
      <VStack space="md" className="p-4">
        <HStack className="justify-between items-center">
          <HStack space="sm" className="items-center">
            <Icon as={PackageIcon} className="w-5 h-5 text-gray-500" />
            <Text className="font-semibold text-gray-900">Inventario</Text>
          </HStack>
          
          {!showStockAdjustment && (
            <Button
              size="sm"
              onPress={() => setShowStockAdjustment(true)}
              className="bg-blue-600"
            >
              <ButtonText className="text-white">Ajustar Stock</ButtonText>
            </Button>
          )}
        </HStack>

        {showStockAdjustment ? (
          <VStack space="md">
            <HStack className="items-center justify-between">
              <Button
                size="sm"
                onPress={decrementStock}
                className="bg-red-600"
              >
                <Icon as={MinusIcon} className="w-4 h-4 text-white" />
              </Button>

              <VStack className="items-center flex-1">
                <Text className="text-sm text-gray-500">Stock Actual</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {product.stock}
                </Text>
                {stockAdjustment !== 0 && (
                  <>
                    <Text className={`text-lg font-semibold ${adjustmentColor}`}>
                      {stockAdjustment > 0 ? '+' : ''}{stockAdjustment}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Nuevo: {newStock} unidades
                    </Text>
                  </>
                )}
              </VStack>

              <Button
                size="sm"
                onPress={incrementStock}
                className="bg-green-600"
              >
                <Icon as={PlusIcon} className="w-4 h-4 text-white" />
              </Button>
            </HStack>

            <HStack space="sm">
              <Button
                className="flex-1 bg-gray-600"
                onPress={handleCancel}
              >
                <ButtonText className="text-white">Cancelar</ButtonText>
              </Button>
              
              <Button
                className="flex-1 bg-blue-600"
                onPress={handleApply}
                disabled={stockAdjustment === 0 || isUpdating}
              >
                {isUpdating ? (
                  <HStack space="sm" className="items-center">
                    <Spinner size="small" color="white" />
                    <ButtonText className="text-white">Actualizando...</ButtonText>
                  </HStack>
                ) : (
                  <ButtonText className="text-white font-semibold">
                    Aplicar Ajuste
                  </ButtonText>
                )}
              </Button>
            </HStack>
          </VStack>
        ) : (
          <VStack space="sm">
            <HStack className="justify-between items-center">
              <Text className="text-gray-600">Stock Actual</Text>
              <Text className="text-xl font-bold text-gray-900">
                {product.stock} unidades
              </Text>
            </HStack>

            {isLowStock && (
              <HStack space="sm" className="items-center bg-orange-50 p-3 rounded-lg">
                <Icon as={AlertTriangleIcon} className="w-5 h-5 text-orange-600" />
                <Text className="text-orange-700 text-sm flex-1">
                  Stock bajo. Considera reponer este producto pronto.
                </Text>
              </HStack>
            )}
          </VStack>
        )}
      </VStack>
    </Card>
  );
};