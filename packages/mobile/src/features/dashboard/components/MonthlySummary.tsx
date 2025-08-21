import { Badge, BadgeText } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { AlertCircleIcon, UserPlusIcon } from 'lucide-react-native';
import React from 'react';

interface MonthlySummaryProps {
  stats: any;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ stats }) => {
  return (
    <Card className="p-4">
      <VStack className="gap-3">
        <Heading className="text-lg font-semibold text-gray-900 mb-2">
          Resumen del Mes
        </Heading>

        <HStack className="items-center justify-between">
          <HStack className="items-center gap-2">
            <Icon as={UserPlusIcon} className="w-4 h-4 text-blue-600" />
            <Text className="text-sm text-gray-600">Nuevos clientes</Text>
          </HStack>
          <Badge variant="solid" action="info">
            <BadgeText>{stats?.newClientsThisMonth || 0}</BadgeText>
          </Badge>
        </HStack>

        <Divider />

        <HStack className="items-center justify-between">
          <HStack className="items-center gap-2">
            <Icon as={AlertCircleIcon} className="w-4 h-4 text-yellow-600" />
            <Text className="text-sm text-gray-600">Contratos por vencer</Text>
          </HStack>
          <Badge variant="solid" action="warning">
            <BadgeText>{stats?.expiringContractsCount || 0}</BadgeText>
          </Badge>
        </HStack>
      </VStack>
    </Card>
  );
};