import React from 'react';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { CreditCardIcon } from 'lucide-react-native';
import type { Contract } from '@gymspace/sdk';

interface ContractPaymentMethodCardProps {
  contract: Contract;
}

export const ContractPaymentMethodCard: React.FC<ContractPaymentMethodCardProps> = ({ contract }) => {
  // Check if payment method information is available
  if (!contract.paymentMethod) {
    return null;
  }

  return (
    <Card className="p-4">
      <HStack className="items-center mb-4 gap-2">
        <Icon as={CreditCardIcon} size="sm" className="text-gray-600" />
        <Heading size="md">Método de pago</Heading>
      </HStack>
      
      <VStack className="gap-3">
        <HStack className="justify-between">
          <Text className="text-gray-600">Método:</Text>
          <Text className="font-medium">{contract.paymentMethod.name}</Text>
        </HStack>

        {contract.paymentMethod.description && (
          <HStack className="justify-between">
            <Text className="text-gray-600">Descripción:</Text>
            <Text className="font-medium">{contract.paymentMethod.description}</Text>
          </HStack>
        )}

        <HStack className="justify-between">
          <Text className="text-gray-600">Código:</Text>
          <Text className="font-medium">{contract.paymentMethod.code}</Text>
        </HStack>

        <HStack className="justify-between">
          <Text className="text-gray-600">Estado:</Text>
          <Text className={`font-medium ${contract.paymentMethod.enabled ? 'text-green-600' : 'text-red-600'}`}>
            {contract.paymentMethod.enabled ? 'Activo' : 'Inactivo'}
          </Text>
        </HStack>
      </VStack>
    </Card>
  );
};