import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { View } from 'react-native';
import { Pressable } from 'react-native';
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
import { SheetManager } from '@gymspace/sheet';

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
        product,
        stockAdjustment,
        newStock,
        wouldExceedMax,
        wouldGoBelowMin,
        onConfirm: handleConfirmAdjustment,
        onCancel: handleCancel,
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

        SheetManager.hide('stock-adjustment-modal');
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
    <VStack space="lg">
      <HStack className="justify-between items-center">
        <HStack space="md" className="items-center">
          <Icon as={PackageIcon} className="w-5 h-5 text-gray-500" />
          <Text className="text-lg font-semibold text-gray-900">Inventario</Text>
        </HStack>

        {!showStockAdjustment && (
          <Button size="sm" variant="solid" onPress={() => setShowStockAdjustment(true)}>
            <ButtonText>Ajustar</ButtonText>
          </Button>
        )}
      </HStack>
      {showStockAdjustment ? (
        <VStack space="lg">
          {/* Stock Counter Section */}
          <View className="bg-gray-50 rounded-xl p-6">
            <Text className="text-center text-sm text-gray-500 mb-2">Stock Actual</Text>

            <HStack className="items-center justify-between">
              {/* Decrease Button */}
              <Pressable
                onPress={decrementStock}
                className="bg-red-500 rounded-xl p-4 active:bg-red-600"
                style={{
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
              >
                <Icon as={MinusIcon} className="w-6 h-6 text-white" />
              </Pressable>

              {/* Stock Display */}
              <VStack className="items-center flex-1 px-4">
                <Text className="text-4xl font-bold text-gray-900">{newStock}</Text>
                {stockAdjustment !== 0 && (
                  <View className="mt-2">
                    <Text className={`text-sm font-medium ${adjustmentColor}`}>
                      {stockAdjustment > 0 ? '+' : ''}
                      {stockAdjustment} unidades
                    </Text>
                  </View>
                )}
              </VStack>

              {/* Increase Button */}
              <Pressable
                onPress={incrementStock}
                className="bg-green-500 rounded-xl p-4 active:bg-green-600"
                style={{
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
              >
                <Icon as={PlusIcon} className="w-6 h-6 text-white" />
              </Pressable>
            </HStack>

            {/* Warnings */}
            {(wouldExceedMax || wouldGoBelowMin) && (
              <View className="mt-4 bg-orange-100 rounded-lg p-3">
                {wouldExceedMax && (
                  <HStack space="sm" className="items-center">
                    <Icon as={AlertTriangleIcon} className="w-4 h-4 text-orange-600" />
                    <Text className="text-xs text-orange-700 flex-1">
                      Excede el stock máximo ({product.maxStock} unidades)
                    </Text>
                  </HStack>
                )}
                {wouldGoBelowMin && (
                  <HStack space="sm" className="items-center mt-1">
                    <Icon as={AlertTriangleIcon} className="w-4 h-4 text-orange-600" />
                    <Text className="text-xs text-orange-700 flex-1">
                      Por debajo del stock mínimo ({product.minStock} unidades)
                    </Text>
                  </HStack>
                )}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <HStack space="md">
            <Button className="flex-1" variant="outline" onPress={handleCancel} size="lg">
              <ButtonText className="font-medium">Cancelar</ButtonText>
            </Button>
            <Button
              className="flex-1 bg-gray-900"
              variant="solid"
              onPress={handleProceedToConfirmation}
              disabled={stockAdjustment === 0}
              size="lg"
            >
              <HStack space="sm" className="items-center">
                <Icon as={CheckIcon} className="w-5 h-5 text-white" />
                <ButtonText className="font-semibold text-white">Confirmar</ButtonText>
              </HStack>
            </Button>
          </HStack>
        </VStack>
      ) : (
        <VStack space="md">
          <HStack className="justify-between items-center">
            <Text className="text-gray-600">Stock Actual</Text>
            <Text className="text-2xl font-bold text-gray-900">{product.stock} unidades</Text>
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
  );
};
