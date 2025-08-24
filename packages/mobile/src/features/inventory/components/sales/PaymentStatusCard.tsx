import React from 'react';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useLoadingScreen } from '@/shared/loading-screen';
import { useUpdatePaymentStatus } from '@/hooks/useSales';
import type { Sale } from '@gymspace/sdk';

interface PaymentStatusCardProps {
  sale: Sale;
}

export function PaymentStatusCard({ sale }: PaymentStatusCardProps) {
  const updatePaymentMutation = useUpdatePaymentStatus();
  const { execute } = useLoadingScreen();
  const isPaid = sale.paymentStatus === 'paid';

  const handleUpdatePaymentStatus = async (newStatus: 'paid' | 'unpaid') => {
    const statusText = newStatus === 'paid' ? 'pagado' : 'pendiente';
    
    await execute(
      updatePaymentMutation.mutateAsync({
        id: sale.id,
        paymentStatus: newStatus,
      }),
      {
        action: `Marcando venta como ${statusText}...`,
        successMessage: `Venta marcada como ${statusText} exitosamente`,
        successActions: [
          {
            label: 'Aceptar',
            onPress: () => {
              // Modal will be closed automatically
            },
            variant: 'solid',
          },
        ],
        errorFormatter: (error) => {
          if (error instanceof Error) {
            return `Error al actualizar: ${error.message}`;
          }
          return 'No se pudo actualizar el estado de pago. Por favor intenta nuevamente.';
        },
        errorActions: [
          {
            label: 'Reintentar',
            onPress: () => {
              // Modal will be closed automatically
              handleUpdatePaymentStatus(newStatus);
            },
            variant: 'solid',
          },
          {
            label: 'Cancelar',
            onPress: () => {
              // Modal will be closed automatically
            },
            variant: 'outline',
          },
        ],
        hideOnSuccess: false,
      }
    );
  };

  return (
    <Card className="bg-white border border-gray-200">
      <VStack space="md" className="p-4">
        <Text className="text-lg font-semibold text-gray-900">
          Estado de Pago
        </Text>
        
        <HStack className="justify-between items-center">
          <Text className="text-base text-gray-700">
            {isPaid ? 'Marcar como pendiente' : 'Marcar como pagado'}
          </Text>
          
          <Switch
            value={isPaid}
            onValueChange={(value) => 
              handleUpdatePaymentStatus(value ? 'paid' : 'unpaid')
            }
          />
        </HStack>
      </VStack>
    </Card>
  );
}