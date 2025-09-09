import React from 'react';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { PlusIcon } from 'lucide-react-native';
import { useNewSale } from '../hooks/useNewSale';

export const CartSummary: React.FC = () => {
  const { itemCount, openItemSelection, hasItems } = useNewSale();
  
  return (
    <HStack className="justify-between items-center">
      <Text className="text-gray-600">
        {itemCount} item{itemCount !== 1 ? 's' : ''} en el carrito
      </Text>

      {hasItems && (
        <Button variant="outline" size="sm" onPress={openItemSelection}>
          <Icon as={PlusIcon} className="w-4 h-4 mr-2 text-black" />
          <ButtonText>Agregar</ButtonText>
        </Button>
      )}
    </HStack>
  );
};