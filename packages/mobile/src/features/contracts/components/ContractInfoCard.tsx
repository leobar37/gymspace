import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Divider } from '@/components/ui/divider';
import type { ContractResponseDto } from '@gymspace/sdk';

interface ContractInfoCardProps {
  contract: ContractResponseDto;
}

export const ContractInfoCard: React.FC<ContractInfoCardProps> = ({ contract }) => {
  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: es });
  };

  const isFrozen = contract.freezeStartDate && contract.freezeEndDate;

  return (
    <Card className="p-4">
      <Heading size="md" className="mb-4">Información del contrato</Heading>
      
      <VStack className="gap-3">
        <HStack className="justify-between">
          <Text className="text-gray-600">Número:</Text>
          <Text className="font-medium">{contract.contractNumber || 'Sin número'}</Text>
        </HStack>

        <HStack className="justify-between">
          <Text className="text-gray-600">Fecha de inicio:</Text>
          <Text className="font-medium">{formatDate(contract.startDate)}</Text>
        </HStack>

        <HStack className="justify-between">
          <Text className="text-gray-600">Fecha de fin:</Text>
          <Text className="font-medium">{formatDate(contract.endDate)}</Text>
        </HStack>

        {isFrozen && (
          <>
            <Divider className="my-2" />
            <HStack className="justify-between">
              <Text className="text-gray-600">Congelado desde:</Text>
              <Text className="font-medium">{formatDate(contract.freezeStartDate!)}</Text>
            </HStack>
            <HStack className="justify-between">
              <Text className="text-gray-600">Congelado hasta:</Text>
              <Text className="font-medium">{formatDate(contract.freezeEndDate!)}</Text>
            </HStack>
          </>
        )}
      </VStack>
    </Card>
  );
};