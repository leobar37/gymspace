import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { router } from 'expo-router';
import { AlertCircleIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable } from 'react-native';

interface ExpiringContractsAlertProps {
  expiringContractsCount: number;
}

export const ExpiringContractsAlert: React.FC<ExpiringContractsAlertProps> = ({
  expiringContractsCount,
}) => {
  if (expiringContractsCount === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-yellow-50 border border-yellow-200">
      <HStack className="items-center gap-3">
        <Icon as={AlertCircleIcon} className="w-5 h-5 text-yellow-600" />
        <VStack className="flex-1">
          <Text className="font-medium text-gray-900">
            Contratos por vencer
          </Text>
          <Text className="text-sm text-gray-600">
            {expiringContractsCount} contratos vencen en los próximos 30 días
          </Text>
        </VStack>
        <Pressable onPress={() => router.push('/contracts/expiring')}>
          <Text className="text-sm font-medium text-blue-600">Ver todos</Text>
        </Pressable>
      </HStack>
    </Card>
  );
};