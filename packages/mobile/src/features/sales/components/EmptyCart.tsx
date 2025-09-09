import React from 'react';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { ShoppingCartIcon, PlusIcon } from 'lucide-react-native';
import { useNewSale } from '../hooks/useNewSale';

export const EmptyCart: React.FC = () => {
  const { openItemSelection } = useNewSale();
  
  return (
    <Card className="bg-gray-50 border-gray-200 border-dashed">
      <VStack space="md" className="p-8 items-center">
        <Icon as={ShoppingCartIcon} className="w-12 h-12 text-gray-400" />
        <VStack space="xs" className="items-center">
          <Text className="text-gray-600 font-medium">Carrito vacío</Text>
          <Text className="text-gray-500 text-center text-sm">
            Agrega items para comenzar una nueva venta
          </Text>
        </VStack>
        <Button onPress={openItemSelection} variant="solid">
          <Icon as={PlusIcon} className="w-4 h-4 mr-2" />
          <ButtonText>Agregar items</ButtonText>
        </Button>
      </VStack>
    </Card>
  );
};