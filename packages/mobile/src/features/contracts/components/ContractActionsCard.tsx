import React from 'react';
import { useRouter } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';
import { ContractStatus } from '@gymspace/sdk';
import type { Contract } from '@gymspace/sdk';

interface ContractActionsCardProps {
  contract: Contract;
  onFreezePress: () => void;
  onCancelPress: () => void;
}

export const ContractActionsCard: React.FC<ContractActionsCardProps> = ({ 
  contract, 
  onFreezePress, 
  onCancelPress 
}) => {
  const router = useRouter();
  const isFrozen = contract.freezeStartDate && contract.freezeEndDate;

  const handleRenew = () => {
    router.push(`/contracts/${contract.id}/renew`);
  };

  return (
    <VStack className="gap-3 mt-4">
      {(contract.status === ContractStatus.EXPIRING_SOON || contract.status === ContractStatus.EXPIRED) && (
        <Button onPress={handleRenew} variant="outline">
          <ButtonText>Renovar contrato</ButtonText>
        </Button>
      )}
      
      {contract.status === ContractStatus.ACTIVE && !isFrozen && (
        <Button onPress={onFreezePress} variant="outline">
          <ButtonText>Congelar contrato</ButtonText>
        </Button>
      )}
      
      {(contract.status === ContractStatus.ACTIVE || contract.status === ContractStatus.PENDING) && (
        <Button
          onPress={onCancelPress}
          action="negative"
          variant="outline"
        >
          <ButtonText>Cancelar contrato</ButtonText>
        </Button>
      )}
    </VStack>
  );
};