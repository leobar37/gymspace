import React from 'react';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { CheckIcon, PlusIcon } from 'lucide-react-native';
import { useFormatPrice } from '@/config/ConfigContext';
import { useLoadingScreen } from '@/shared/loading-screen';
import { useNewSale } from '../hooks/useNewSale';
import { router } from 'expo-router';

export const SaleTotalFooter: React.FC = () => {
  const formatPrice = useFormatPrice();
  const { execute } = useLoadingScreen();
  const { total, completeSale, resetSale, openItemSelection } = useNewSale();

  const handleCompleteSale = async () => {
    await execute(completeSale(), {
      action: 'Procesando venta...',
      successMessage: `Venta por ${formatPrice(total)} completada exitosamente`,
      successActions: [
        {
          label: 'Nueva venta',
          onPress: () => {
            resetSale();
          },
          variant: 'solid',
        },
        {
          label: 'Volver al inicio',
          onPress: () => {
            resetSale();
            router.push('/(app)');
          },
          variant: 'outline',
        },
      ],
      errorFormatter: (error) => {
        if (error instanceof Error) {
          return `Error al procesar la venta: ${error.message}`;
        }
        return 'No se pudo completar la venta. Por favor intenta nuevamente.';
      },
      errorActions: [
        {
          label: 'Reintentar',
          onPress: () => {
            // The user can retry from the same screen
          },
          variant: 'solid',
        },
        {
          label: 'Cancelar',
          onPress: () => {
            // No action needed, just close the modal
          },
          variant: 'outline',
        },
      ],
      hideOnSuccess: false,
    });
  };

  return (
    <VStack space="sm">
      {/* Total Display */}
      <HStack className="justify-between items-center p-4 bg-gray-50 rounded-lg">
        <Text className="text-lg font-medium text-gray-700">Total</Text>
        <Text className="text-2xl font-bold text-gray-900">
          {formatPrice(total)}
        </Text>
      </HStack>

      {/* Action Buttons */}
      <HStack space="sm">
        {/* Add Items Button */}
        <Button onPress={openItemSelection} variant="outline" size="md" className="flex-1">
          <HStack space="xs" className="items-center">
            <Icon as={PlusIcon} className="w-4 h-4" />
            <ButtonText>Agregar items</ButtonText>
          </HStack>
        </Button>

        {/* Complete Sale Button */}
        <Button onPress={handleCompleteSale} variant="solid" size="md" className="flex-1">
          <HStack space="xs" className="items-center">
            <Icon as={CheckIcon} className="w-4 h-4" />
            <ButtonText className="font-semibold">Completar</ButtonText>
          </HStack>
        </Button>
      </HStack>
    </VStack>
  );
};