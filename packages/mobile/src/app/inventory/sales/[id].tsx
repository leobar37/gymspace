import React from 'react';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { View } from '@/components/ui/view';
import { Spinner } from '@/components/ui/spinner';
import { Alert as UIAlert, AlertIcon, AlertText } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSale } from '@/features/inventory/hooks/useSales';
import { useFormatPrice } from '@/config/ConfigContext';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { SaleInfoCard, PaymentStatusCard, FilesSection, ProductsList } from '@/features/inventory/components/sales';

export default function SaleDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id as string;
  const formatPrice = useFormatPrice();

  const { data: sale, isLoading, isError, error, refetch } = useSale(id);

  if (!id) {
    return (
      <ScreenForm title="Detalle de Venta">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">ID de venta no válido</Text>
        </View>
      </ScreenForm>
    );
  }

  if (isLoading) {
    return (
      <ScreenForm title="Detalle de Venta">
        <View className="flex-1 items-center justify-center">
          <Spinner size="large" />
          <Text className="text-gray-600 mt-4">Cargando venta...</Text>
        </View>
      </ScreenForm>
    );
  }

  if (isError || !sale) {
    return (
      <ScreenForm title="Detalle de Venta">
        <View className="flex-1 items-center justify-center">
          <UIAlert action="error" variant="solid" className="max-w-sm">
            <AlertIcon as={InfoIcon} />
            <AlertText>
              Error al cargar la venta: {error?.message || 'Venta no encontrada'}
            </AlertText>
          </UIAlert>
          <Button
            variant="outline"
            onPress={() => refetch()}
            className="mt-4"
          >
            <ButtonText>Reintentar</ButtonText>
          </Button>
        </View>
      </ScreenForm>
    );
  }

  return (
    <ScreenForm 
      title="Detalle de Venta"
      showFixedFooter={true}
      footerContent={
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-semibold text-blue-900">Total de la Venta</Text>
            <Text className="text-3xl font-bold text-blue-900">{formatPrice(sale.total)}</Text>
          </View>
        </View>
      }
    >
      <SaleInfoCard sale={sale} />
      <PaymentStatusCard sale={sale} />
      <FilesSection fileIds={sale.fileIds || []} />
      <ProductsList sale={sale} />
    </ScreenForm>
  );
}