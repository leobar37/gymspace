import React from 'react';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Divider } from '@/components/ui/divider';
import type { ContractResponseDto } from '@gymspace/sdk';

interface ContractPricingCardProps {
  contract: ContractResponseDto;
  formatPrice: (price: number) => string;
}

export const ContractPricingCard: React.FC<ContractPricingCardProps> = ({ 
  contract, 
  formatPrice 
}) => {
  return (
    <Card className="p-4">
      <Heading size="md" className="mb-4">Información de precios</Heading>
      
      <VStack className="gap-3">
        <HStack className="justify-between">
          <Text className="text-gray-600">Precio base:</Text>
          <Text className="font-medium">
            {contract.gymMembershipPlan?.basePrice 
              ? formatPrice(Number(contract.gymMembershipPlan.basePrice))
              : 'N/A'}
          </Text>
        </HStack>

        {contract.discountPercentage && contract.discountPercentage > 0 && (
          <HStack className="justify-between">
            <Text className="text-gray-600">Descuento:</Text>
            <Text className="font-medium text-green-600">{contract.discountPercentage}%</Text>
          </HStack>
        )}

        <Divider />

        <HStack className="justify-between">
          <Text className="font-semibold">Precio final:</Text>
          <Text className="font-bold text-lg">
            {contract.finalPrice !== null && contract.finalPrice !== undefined
              ? formatPrice(Number(contract.finalPrice))
              : formatPrice(Number(contract.gymMembershipPlan?.basePrice || 0))}
          </Text>
        </HStack>
      </VStack>
    </Card>
  );
};