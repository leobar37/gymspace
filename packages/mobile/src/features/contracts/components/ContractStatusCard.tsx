import React from 'react';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Badge, BadgeText } from '@/components/ui/badge';
import { ContractStatus } from '@gymspace/sdk';
import type { ContractResponseDto } from '@gymspace/sdk';

interface ContractStatusCardProps {
  contract: ContractResponseDto;
}

export const ContractStatusCard: React.FC<ContractStatusCardProps> = ({ contract }) => {
  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return { variant: 'success' as const, text: 'Activo' };
      case ContractStatus.PENDING:
        return { variant: 'info' as const, text: 'Pendiente' };
      case ContractStatus.EXPIRING_SOON:
        return { variant: 'warning' as const, text: 'Por vencer' };
      case ContractStatus.EXPIRED:
        return { variant: 'error' as const, text: 'Vencido' };
      case ContractStatus.CANCELLED:
        return { variant: 'muted' as const, text: 'Cancelado' };
      default:
        return { variant: 'muted' as const, text: status };
    }
  };

  const statusInfo = getStatusBadge(contract.status);
  const isFrozen = contract.freezeStartDate && contract.freezeEndDate;

  return (
    <Card className="p-4">
      <HStack className="justify-between items-center">
        <VStack>
          <Text className="text-sm text-gray-500 mb-1">Estado del contrato</Text>
          <Badge action={statusInfo.variant} size="lg">
            <BadgeText>{statusInfo.text}</BadgeText>
          </Badge>
        </VStack>
        {isFrozen && (
          <Badge action="info">
            <BadgeText>Congelado</BadgeText>
          </Badge>
        )}
      </HStack>
    </Card>
  );
};