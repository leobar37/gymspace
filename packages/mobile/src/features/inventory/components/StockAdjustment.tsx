import React, { useState } from 'react';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper
} from '@/components/ui/actionsheet';
import { FormProvider } from '@/components/forms';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSelect } from '@/components/forms/FormSelect';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProductDetailStore } from '../stores/product-detail.store';
import { useSuppliers } from '../../suppliers/controllers/suppliers.controller';
import { useLoadingScreen } from '@/shared/loading-screen';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { 
  PackageIcon, 
  MinusIcon, 
  PlusIcon,
  AlertTriangleIcon,
  CheckIcon,
  FileTextIcon,
  TruckIcon
} from 'lucide-react-native';
import type { Product, UpdateStockDto } from '@gymspace/sdk';

/**
 * StockAdjustment component provides an enhanced stock management interface
 * with a confirmation drawer that includes notes and supplier selection.
 * 
 * Features:
 * - Stock increment/decrement with visual feedback
 * - Confirmation drawer with additional details
 * - Notes field for tracking adjustment reasons
 * - Supplier selection for purchase tracking
 * - Integration with useLoadingScreen for UX
 * - Automatic API calls using useGymSdk
 * 
 * Usage:
 * <StockAdjustment 
 *   product={product} 
 *   isLowStock={product.stock <= product.minStock}
 *   onStockUpdated={() => refetch()}
 * />
 */

// Form validation schema
const stockAdjustmentSchema = z.object({
  notes: z.string().optional(),
  supplierId: z.string().optional(),
  fileId: z.string().optional(),
});

type StockAdjustmentForm = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentProps {
  product: Product;
  isLowStock: boolean;
  onStockUpdated?: () => void;
}

export const StockAdjustment: React.FC<StockAdjustmentProps> = ({ 
  product,
  isLowStock,
  onStockUpdated
}) => {
  const { sdk } = useGymSdk();
  const { execute } = useLoadingScreen();
  const [showConfirmationSheet, setShowConfirmationSheet] = useState(false);

  // Get suppliers for selection
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();

  const {
    showStockAdjustment,
    stockAdjustment,
    setShowStockAdjustment,
    incrementStock,
    decrementStock,
    resetStockAdjustment
  } = useProductDetailStore();

  // Form for additional details
  const form = useForm<StockAdjustmentForm>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      notes: '',
      supplierId: undefined,
      fileId: undefined,
    }
  });

  const handleProceedToConfirmation = () => {
    if (stockAdjustment !== 0) {
      setShowConfirmationSheet(true);
    }
  };

  const handleConfirmAdjustment = async (data: StockAdjustmentForm) => {
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
        
        // Reset form and state
        form.reset();
        resetStockAdjustment();
        setShowConfirmationSheet(false);
        
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
        }
      }
    );
  };

  const handleCancel = () => {
    resetStockAdjustment();
    setShowConfirmationSheet(false);
    form.reset();
  };

  const newStock = (product.stock || 0) + stockAdjustment;
  const adjustmentColor = stockAdjustment > 0 ? 'text-green-600' : stockAdjustment < 0 ? 'text-red-600' : 'text-gray-600';

  // Prepare supplier options
  const supplierOptions = suppliers.map((supplier: any) => ({
    label: supplier.name,
    value: supplier.id
  }));

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
                onPress={handleProceedToConfirmation}
                disabled={stockAdjustment === 0}
              >
                <HStack space="sm" className="items-center">
                  <Icon as={CheckIcon} className="w-4 h-4 text-white" />
                  <ButtonText className="text-white font-semibold">
                    Confirmar
                  </ButtonText>
                </HStack>
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

      {/* Confirmation ActionSheet */}
      <Actionsheet isOpen={showConfirmationSheet} onClose={() => setShowConfirmationSheet(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          
          <VStack space="lg" className="w-full px-4 pb-6">
            {/* Header */}
            <VStack space="sm" className="w-full">
              <HStack space="sm" className="items-center justify-center">
                <Icon as={PackageIcon} className="w-6 h-6 text-blue-600" />
                <Text className="text-lg font-bold text-gray-900">
                  Confirmar Ajuste de Stock
                </Text>
              </HStack>
              
              <VStack space="xs" className="items-center">
                <Text className="text-sm text-gray-600">
                  {product.name}
                </Text>
                <HStack space="sm" className="items-center">
                  <Text className="text-base text-gray-900">
                    Stock actual: <Text className="font-semibold">{product.stock || 0}</Text>
                  </Text>
                  <Icon as={PlusIcon} className="w-4 h-4 text-gray-400" />
                  <Text className={`text-base font-semibold ${adjustmentColor}`}>
                    {stockAdjustment > 0 ? '+' : ''}{stockAdjustment}
                  </Text>
                  <Icon as={PlusIcon} className="w-4 h-4 text-gray-400" />
                  <Text className="text-base font-bold text-gray-900">
                    = {newStock}
                  </Text>
                </HStack>
              </VStack>
            </VStack>

            {/* Form */}
            <FormProvider form={form}>
              <VStack space="md" className="w-full">
                {/* Notes */}
                <VStack space="xs">
                  <HStack space="sm" className="items-center">
                    <Icon as={FileTextIcon} className="w-5 h-5 text-gray-500" />
                    <Text className="text-sm font-medium text-gray-700">
                      Notas (Opcional)
                    </Text>
                  </HStack>
                  <FormTextarea
                    name="notes"
                    label=""
                    placeholder="Ej: Reposición mensual, compra especial..."
                    className="min-h-20"
                  />
                </VStack>

                {/* Supplier Selection */}
                <VStack space="xs">
                  <HStack space="sm" className="items-center">
                    <Icon as={TruckIcon} className="w-5 h-5 text-gray-500" />
                    <Text className="text-sm font-medium text-gray-700">
                      Proveedor (Opcional)
                    </Text>
                  </HStack>
                  <FormSelect
                    name="supplierId"
                    placeholder="Seleccionar proveedor"
                    options={supplierOptions}
                    disabled={suppliersLoading}
                  />
                  {suppliersLoading && (
                    <HStack space="sm" className="items-center">
                      <Spinner size="small" />
                      <Text className="text-xs text-gray-500">
                        Cargando proveedores...
                      </Text>
                    </HStack>
                  )}
                </VStack>

                {/* TODO: File attachment can be added later */}
              </VStack>
            </FormProvider>

            {/* Action Buttons */}
            <VStack space="sm" className="w-full">
              <Button
                className="bg-blue-600"
                onPress={form.handleSubmit(handleConfirmAdjustment)}
              >
                <HStack space="sm" className="items-center">
                  <Icon as={CheckIcon} className="w-4 h-4 text-white" />
                  <ButtonText className="text-white font-semibold">
                    Aplicar Ajuste
                  </ButtonText>
                </HStack>
              </Button>
              
              <Button
                variant="outline"
                className="border-gray-300"
                onPress={() => setShowConfirmationSheet(false)}
              >
                <ButtonText className="text-gray-700">
                  Cancelar
                </ButtonText>
              </Button>
            </VStack>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </Card>
  );
};