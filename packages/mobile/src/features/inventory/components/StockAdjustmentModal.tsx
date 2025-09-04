import { FormProvider } from '@/components/forms';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { SupplierSelector } from '@/features/suppliers/components';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { Product } from '@gymspace/sdk';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangleIcon,
  CheckIcon,
  FileTextIcon,
  PackageIcon,
  XIcon,
} from 'lucide-react-native';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import ActionSheet, { SheetProps, ScrollView } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Form validation schema
const stockAdjustmentSchema = z.object({
  notes: z.string().optional(),
  supplierId: z.string().optional(),
  fileId: z.string().optional(),
});

type StockAdjustmentForm = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentPayload {
  product: Product;
  stockAdjustment: number;
  newStock: number;
  wouldExceedMax: boolean;
  wouldGoBelowMin: boolean;
  onConfirm: (data: StockAdjustmentForm) => Promise<void>;
  onCancel: () => void;
}

export const StockAdjustmentModal: React.FC<SheetProps<'stock-adjustment-modal'>> = (props) => {
  const insets = useSafeAreaInsets();

  const {
    product,
    stockAdjustment,
    newStock,
    wouldExceedMax,
    wouldGoBelowMin,
    onConfirm,
    onCancel,
  } = props.payload || ({} as StockAdjustmentPayload);

  // Form for additional details
  const form = useForm<StockAdjustmentForm>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      notes: '',
      supplierId: undefined,
      fileId: undefined,
    },
  });

  const adjustmentColor =
    stockAdjustment > 0 ? 'text-green-600' : stockAdjustment < 0 ? 'text-red-600' : 'text-gray-600';

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  const handleConfirm = async (data: StockAdjustmentForm) => {
    await onConfirm?.(data);
    form.reset();
  };

  if (!props.payload) {
    return null;
  }

  return (
    <ActionSheet
      id={props.sheetId}
      snapPoints={[100]}
      initialSnapIndex={0}
      headerAlwaysVisible
      useBottomSafeAreaPadding
      keyboardHandlerEnabled
      enableGesturesInScrollView
      gestureEnabled
      closeOnPressBack
    >
      <VStack className="bg-white rounded-t-3xl">
        {/* Header */}
        <VStack className="px-6 pt-6 pb-4 border-b border-gray-100">
          <HStack space="sm" className="items-center justify-between">
            <HStack space="sm" className="items-center flex-1">
              <Icon as={PackageIcon} className="w-6 h-6 text-blue-600" />
              <Text className="text-lg font-bold text-gray-900">Confirmar Ajuste de Stock</Text>
            </HStack>
            <Button
              size="sm"
              variant="outline"
              onPress={handleCancel}
              className="p-2 border-gray-200"
            >
              <Icon as={XIcon} className="w-5 h-5 text-gray-500" />
            </Button>
          </HStack>
        </VStack>
        {/* Scrollable Content */}
        <VStack className="px-6 py-4">
          <VStack space="lg" className="w-full">
            {/* Product and Stock Info */}
            <VStack space="sm" className="w-full">
              <VStack space="xs" className="items-center">
                <Text className="text-sm text-gray-600">{product.name}</Text>
                <HStack space="sm" className="items-center">
                  <Text className="text-base text-gray-900">
                    Stock actual: <Text className="font-semibold">{product.stock || 0}</Text>
                  </Text>
                  <Text className="text-gray-400">→</Text>
                  <Text className={`text-base font-semibold ${adjustmentColor}`}>
                    {stockAdjustment > 0 ? '+' : ''}
                    {stockAdjustment}
                  </Text>
                  <Text className="text-gray-400">→</Text>
                  <Text className="text-base font-bold text-gray-900">{newStock}</Text>
                </HStack>
                {/* Stock limits info if configured */}
                {(product.minStock || product.maxStock) && (
                  <Text className="text-xs text-gray-500 mt-1">
                    Límites: {product.minStock && `Min: ${product.minStock}`}
                    {product.minStock && product.maxStock && ' • '}
                    {product.maxStock && `Max: ${product.maxStock}`}
                  </Text>
                )}
                {/* Warnings for exceeding limits */}
                {(wouldExceedMax || wouldGoBelowMin) && (
                  <VStack space="xs" className="mt-2 w-full">
                    {wouldExceedMax && (
                      <HStack space="xs" className="items-center bg-orange-50 px-3 py-2 rounded-md">
                        <Icon as={AlertTriangleIcon} className="w-4 h-4 text-orange-600" />
                        <Text className="text-xs text-orange-700 flex-1">
                          El nuevo stock excederá el máximo configurado
                        </Text>
                      </HStack>
                    )}
                    {wouldGoBelowMin && (
                      <HStack space="xs" className="items-center bg-orange-50 px-3 py-2 rounded-md">
                        <Icon as={AlertTriangleIcon} className="w-4 h-4 text-orange-600" />
                        <Text className="text-xs text-orange-700 flex-1">
                          El nuevo stock estará por debajo del mínimo
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                )}
              </VStack>
            </VStack>
            {/* Form */}
            <FormProvider {...form}>
              <VStack space="md" className="w-full">
                {/* Notes */}
                <VStack space="xs">
                  <HStack space="sm" className="items-center">
                    <Icon as={FileTextIcon} className="w-5 h-5 text-gray-500" />
                    <Text className="text-sm font-medium text-gray-700">Notas (Opcional)</Text>
                  </HStack>
                  <FormTextarea
                    name="notes"
                    label=""
                    placeholder="Ej: Reposición mensual, compra especial..."
                    className="min-h-20"
                  />
                </VStack>
                {/* Supplier Selection */}
                <SupplierSelector
                  name="supplierId"
                  control={form.control}
                  label="Proveedor (Opcional)"
                  placeholder="Seleccionar proveedor"
                  allowClear={true}
                />
                {/* TODO: File attachment can be added later */}
              </VStack>
            </FormProvider>
          </VStack>
        </VStack>
        {/* Footer */}
        <VStack className="px-6 pt-4 border-t border-gray-100 bg-white">
          <VStack space="sm" className="w-full">
            <Button variant="solid" onPress={form.handleSubmit(handleConfirm)}>
              <HStack space="sm" className="items-center">
                <Icon as={CheckIcon} className="w-4 h-4" />
                <ButtonText className="font-semibold">Aplicar Ajuste</ButtonText>
              </HStack>
            </Button>
            <Button variant="outline" onPress={handleCancel}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
          </VStack>
        </VStack>
      </VStack>
    </ActionSheet>
  );
};
