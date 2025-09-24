import React from 'react';
import { Badge, BadgeText } from '@/components/ui/badge';
import { calculateDaysRemaining } from '@/utils/contract-utils';

interface ClientContract {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  freezeStartDate?: string;
  freezeEndDate?: string;
  gymMembershipPlan?: {
    id: string;
    name: string;
  };
}

interface ContractStatusBadgeProps {
  contracts?: ClientContract[];
}

export function ContractStatusBadge({ contracts }: ContractStatusBadgeProps) {
  if (!contracts || contracts.length === 0) {
    return null;
  }

  const activeContract = contracts
    .filter(c => c.status === 'active' || c.status === 'expiring_soon')
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

  if (!activeContract) {
    return null;
  }

  if (activeContract.status === 'expired') {
    return (
      <Badge variant="outline" action="error">
        <BadgeText>EXPIRADO</BadgeText>
      </Badge>
    );
  }

  if (activeContract.freezeStartDate && activeContract.freezeEndDate) {
    const freezeStart = new Date(activeContract.freezeStartDate);
    const freezeEnd = new Date(activeContract.freezeEndDate);
    const now = new Date();

    if (now >= freezeStart && now <= freezeEnd) {
      return (
        <Badge variant="outline" action="info">
          <BadgeText>CONGELADO</BadgeText>
        </Badge>
      );
    }
  }

  const daysRemaining = calculateDaysRemaining(activeContract.endDate);

  if (daysRemaining <= 0) {
    return (
      <Badge variant="outline" action="error">
        <BadgeText>EXPIRADO</BadgeText>
      </Badge>
    );
  }

  if (daysRemaining <= 3) {
    return (
      <Badge variant="solid" action="warning">
        <BadgeText>VENCE EN {daysRemaining} DÍAS</BadgeText>
      </Badge>
    );
  }

  if (daysRemaining <= 7) {
    return (
      <Badge variant="outline" action="warning">
        <BadgeText>VENCE EN {daysRemaining} DÍAS</BadgeText>
      </Badge>
    );
  }

  if (daysRemaining <= 30) {
    return (
      <Badge variant="outline" action="success">
        <BadgeText>{daysRemaining} DÍAS RESTANTES</BadgeText>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" action="info">
      <BadgeText>{daysRemaining} DÍAS RESTANTES</BadgeText>
    </Badge>
  );
}