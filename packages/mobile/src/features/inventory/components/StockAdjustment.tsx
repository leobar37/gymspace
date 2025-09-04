import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useLoadingScreen } from '@/shared/loading-screen';
import type { Product, UpdateStockDto } from '@gymspace/sdk';
import {
  AlertTriangleIcon,
  CheckIcon,
  MinusIcon,
  PackageIcon,
  PlusIcon,
} from 'lucide-react-native';
import React from 'react';
import { useProductDetailStore } from '../stores/product-detail.store';
import { SheetManager } from 'react-native-actions-sheet';


interface StockAdjustmentProps {
  product: Product;
  isLowStock: boolean;
  onStockUpdated?: () => void;
}

export const StockAdjustment: React.FC<StockAdjustmentProps> = ({
  product,
  isLowStock,
  onStockUpdated,
}) => {
  const { sdk } = useGymSdk();
  const { execute } = useLoadingScreen();
  const {
    showStockAdjustment,
    stockAdjustment,
    setShowStockAdjustment,
    incrementStock,
    decrementStock,
    resetStockAdjustment,
  } = useProductDetailStore();

  const handleProceedToConfirmation = () => {
    if (stockAdjustment !== 0) {
      SheetManager.show('stock-adjustment-modal', {
        payload: {
          product,
          stockAdjustment,
          newStock,
          wouldExceedMax,
          wouldGoBelowMin,
          onConfirm: handleConfirmAdjustment,
          onCancel: handleCancel,
        },
      });
    }
  };

  const handleConfirmAdjustment = async (data: any) => {
    const newStock = (product.stock || 0) + stockAdjustment;

    const updateData: UpdateStockDto = {
      quantity: newStock,
      notes: data.notes || undefined,
      supplierId: data.supplierId || undefined,
      fileId: data.fileId || undefined,
    };

    await execute(
      (async () => {
        await sdk.products.updateStock(product.id, updateData);

        // Reset state
        resetStockAdjustment();

        // Notify parent
        onStockUpdated?.();
      })(),
      {
        action: 'Actualizando inventario...',
        successMessage: 'Inventario actualizado correctamente',
        successActions: [],
        errorFormatter: (error: any) => {
          if (error?.response?.data?.message) {
            return error.response.data.message;
          }
          return 'Error al actualizar el inventario';
        },
      },
    );
  };

  const handleCancel = () => {
    resetStockAdjustment();
  };

  const newStock = (product.stock || 0) + stockAdjustment;
  const adjustmentColor =
    stockAdjustment > 0 ? 'text-green-600' : stockAdjustment < 0 ? 'text-red-600' : 'text-gray-600';

  const wouldExceedMax = !!(product.maxStock && newStock > product.maxStock);
  const wouldGoBelowMin = !!(product.minStock && newStock < product.minStock);

  return (
    <Card className="bg-white border border-gray-200">
      <VStack space="md" className="p-4">
        <HStack className="justify-between items-center">
          <HStack space="sm" className="items-center">
            <Icon as={PackageIcon} className="w-5 h-5 text-gray-500" />
            <Text className="font-semibold text-gray-900">Inventario</Text>
          </HStack>

          {!showStockAdjustment && (
            <Button size="sm" variant="solid" onPress={() => setShowStockAdjustment(true)}>
              <ButtonText>Ajustar Stock</ButtonText>
            </Button>
          )}
        </HStack>
        {showStockAdjustment ? (
          <VStack space="md">
            <HStack className="items-center justify-between">
              <Button size="sm" variant="solid" onPress={decrementStock} className="bg-red-600">
                <Icon as={MinusIcon} className="w-4 h-4" />
              </Button>

              <VStack className="items-center flex-1">
                <Text className="text-sm text-gray-500">Stock Actual</Text>
                <Text className="text-2xl font-bold text-gray-900">{product.stock}</Text>
                {stockAdjustment !== 0 && (
                  <>
                    <Text className={`text-lg font-semibold ${adjustmentColor}`}>
                      {stockAdjustment > 0 ? '+' : ''}
                      {stockAdjustment}
                    </Text>
                    <Text className="text-sm text-gray-500">Nuevo: {newStock} unidades</Text>
                    {wouldExceedMax && (
                      <Text className="text-xs text-orange-600 font-medium">
                        ⚠️ Excede máximo ({product.maxStock})
                      </Text>
                    )}
                    {wouldGoBelowMin && (
                      <Text className="text-xs text-orange-600 font-medium">
                        ⚠️ Por debajo del mínimo ({product.minStock})
                      </Text>
                    )}
                  </>
                )}
              </VStack>
              <Button size="sm" variant="solid" onPress={incrementStock} className="bg-green-600">
                <Icon as={PlusIcon} className="w-4 h-4" />
              </Button>
            </HStack>

            <HStack space="sm">
              <Button className="flex-1" variant="outline" onPress={handleCancel}>
                <ButtonText>Cancelar</ButtonText>
              </Button>

              <Button
                className="flex-1"
                variant="solid"
                onPress={handleProceedToConfirmation}
                disabled={stockAdjustment === 0}
              >
                <HStack space="sm" className="items-center">
                  <Icon as={CheckIcon} className="w-4 h-4" />
                  <ButtonText className="font-semibold">Confirmar</ButtonText>
                </HStack>
              </Button>
            </HStack>
          </VStack>
        ) : (
          <VStack space="sm">
            <HStack className="justify-between items-center">
              <Text className="text-gray-600">Stock Actual</Text>
              <Text className="text-xl font-bold text-gray-900">{product.stock} unidades</Text>
            </HStack>

            {/* Display min/max stock levels if configured */}
            {(product.minStock || product.maxStock) && (
              <HStack className="justify-between items-center">
                <Text className="text-sm text-gray-500">Niveles de stock</Text>
                <HStack space="sm">
                  {product.minStock && (
                    <Text className="text-sm text-gray-600">Min: {product.minStock}</Text>
                  )}
                  {product.minStock && product.maxStock && (
                    <Text className="text-sm text-gray-400">•</Text>
                  )}
                  {product.maxStock && (
                    <Text className="text-sm text-gray-600">Max: {product.maxStock}</Text>
                  )}
                </HStack>
              </HStack>
            )}

            {isLowStock && (
              <HStack space="sm" className="items-center bg-orange-50 p-3 rounded-lg">
                <Icon as={AlertTriangleIcon} className="w-5 h-5 text-orange-600" />
                <Text className="text-orange-700 text-sm flex-1">
                  Stock bajo{product.minStock ? ` (mínimo: ${product.minStock})` : ''}. Considera
                  reponer este producto pronto.
                </Text>
              </HStack>
            )}

            {product.maxStock && product.stock >= product.maxStock && (
              <HStack space="sm" className="items-center bg-blue-50 p-3 rounded-lg">
                <Icon as={AlertTriangleIcon} className="w-5 h-5 text-blue-600" />
                <Text className="text-blue-700 text-sm flex-1">
                  Stock máximo alcanzado ({product.maxStock} unidades).
                </Text>
              </HStack>
            )}
          </VStack>
        )}
      </VStack>
    </Card>
  );
};
