import { FormTextarea } from '@/components/forms/FormTextarea';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useFormatPrice } from '@/config/ConfigContext';
import { FileSelector } from '@/features/files/components/FileSelector';
import { PaymentMethodSelectorField } from '@/features/payment-methods/components/PaymentMethodSelectorField';
import { useSalesController } from '@/features/sales/controllers/sales.controller';
import { useLoadingScreen } from '@/shared/loading-screen';
import { PaySaleDto } from '@gymspace/sdk';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { BottomSheetWrapper, SheetManager, SheetProps } from '@gymspace/sheet';
import { z } from 'zod';

const paymentSchema = z.object({
  paymentMethodId: z.string().min(1, 'Debe seleccionar un método de pago'),
  fileIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface SaleData {
  id: string;
  saleNumber: string;
  total: number;
  customer?: {
    firstName: string;
    lastName: string;
  } | null;
  customerName?: string | null;
}

interface PaymentFormContentProps {
  sale: SaleData;
  onSuccess?: () => void;
}

const PaymentFormContent: React.FC<PaymentFormContentProps> = ({ sale, onSuccess }) => {
  const formatPrice = useFormatPrice();
  const { execute } = useLoadingScreen();
  const { paySale, isPayingSale } = useSalesController();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethodId: '',
      fileIds: [],
      notes: '',
    },
  });
  console.log('sale in PaymentFormContent:', JSON.stringify(sale, null, 3));

  const handleSubmit = async (data: PaymentFormData) => {
    const paymentData: PaySaleDto = {
      paymentMethodId: data.paymentMethodId,
      fileIds: data.fileIds?.length ? data.fileIds : undefined,
      notes: data.notes || undefined,
    };

    await execute(
      new Promise((resolve, reject) => {
        paySale(
          { id: sale.id, data: paymentData },
          {
            onSuccess: (result: any) => {
              resolve(result);
              form.reset();
              // Close the sheet first
              SheetManager.hide('sale-payment');
              // Then call the success callback
              setTimeout(() => {
                onSuccess?.();
              }, 300); // Small delay to allow sheet animation to complete
            },
            onError: reject,
          },
        );
      }),
      {
        action: 'Procesando pago...',
        successMessage: 'Pago registrado exitosamente',
        successActions: [],
        hideOnSuccess: true,
      },
    );
  };

  const getCustomerName = () => {
    if (sale.customerName) {
      return sale.customerName;
    }
    return 'Cliente sin registrar';
  };

  return (
    <>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
        <Heading size="lg">Procesar Pago</Heading>
        <Pressable onPress={() => SheetManager.hide('sale-payment')} className="p-2">
          <Icon as={X} size="md" className="text-gray-500" />
        </Pressable>
      </View>

      {/* Content */}
      <View className="flex-1 pb-6">
        <FormProvider {...form}>
          <VStack className="p-4 gap-4">
            {/* Sale information */}
            <Box className="bg-blue-50 p-4 rounded-xl">
              <Text className="font-semibold text-blue-900 mb-3">Información de la Venta</Text>
              <VStack className="gap-1">
                <HStack className="justify-between">
                  <Text className="text-sm text-blue-700">N° Venta:</Text>
                  <Text className="text-sm font-medium text-blue-900">{sale.saleNumber}</Text>
                </HStack>
                <HStack className="justify-between">
                  <Text className="text-sm text-blue-700">Cliente:</Text>
                  <Text className="text-sm font-medium text-blue-900">{getCustomerName()}</Text>
                </HStack>
                <HStack className="justify-between">
                  <Text className="text-sm text-blue-700">Total:</Text>
                  <Text className="text-lg font-bold text-blue-900">{formatPrice(sale.total)}</Text>
                </HStack>
              </VStack>
            </Box>

            {/* Payment method selection */}
            <PaymentMethodSelectorField
              name="paymentMethodId"
              label="Método de Pago"
              placeholder="Seleccionar método de pago"
              enabledOnly={true}
              control={form.control}
              rules={{ required: 'Debe seleccionar un método de pago' }}
            />

            {/* Receipt photo upload */}
            <VStack className="gap-2">
              <Text className="text-sm font-semibold text-gray-700">Comprobante (opcional)</Text>
              <FileSelector name="fileIds" multi={true} label="" />
            </VStack>

            {/* Notes */}
            <FormTextarea
              name="notes"
              label="Notas (opcional)"
              placeholder="Notas adicionales sobre el pago"
            />
          </VStack>
        </FormProvider>

        {/* Footer Actions */}
        <View className="px-4 py-3 border-t border-gray-100 bg-white">
          <HStack className="gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onPress={() => SheetManager.hide('sale-payment')}
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onPress={form.handleSubmit(handleSubmit)}
              isDisabled={isPayingSale || !form.watch('paymentMethodId')}
            >
              <ButtonText>Procesar Pago</ButtonText>
            </Button>
          </HStack>
        </View>
      </View>
    </>
  );
};

interface SalePaymentSheetProps extends SheetProps {
  sale?: SaleData;
  onSuccess?: () => void;
}

export const SalePaymentSheet: React.FC<SalePaymentSheetProps> = (props) => {
  const { sale, onSuccess } = props;

  return (
    <BottomSheetWrapper sheetId="sale-payment" snapPoints={['90%']} enablePanDownToClose scrollable>
      {sale ? (
        <PaymentFormContent sale={sale} onSuccess={onSuccess} />
      ) : (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-gray-500">No se pudo cargar la información de la venta</Text>
        </View>
      )}
    </BottomSheetWrapper>
  );
};

SalePaymentSheet.displayName = 'SalePaymentSheet';
