import React from 'react';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { TrendingUp } from 'lucide-react-native';

interface OrganizationStatsCardProps {
  stats: {
    totalGyms: number;
    totalClients: number;
    totalContracts: number;
    activeContracts: number;
  };
}

export default function OrganizationStatsCard({ stats }: OrganizationStatsCardProps) {
  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm">
      <VStack space="md">
        <HStack className="items-center justify-between">
          <Text className="text-lg font-semibold text-gray-900">
            Estadísticas de la Organización
          </Text>
          <Icon as={TrendingUp} size="sm" className="text-gray-500" />
        </HStack>
        
        <VStack space="md">
          <HStack space="md">
            <VStack space="xs" className="flex-1">
              <Text className="text-sm text-gray-500">Total Gimnasios</Text>
              <Text className="text-xl font-bold text-blue-600">
                {stats.totalGyms}
              </Text>
            </VStack>
            
            <VStack space="xs" className="flex-1">
              <Text className="text-sm text-gray-500">Total Clientes</Text>
              <Text className="text-xl font-bold text-green-600">
                {stats.totalClients}
              </Text>
            </VStack>
          </HStack>
          
          <HStack space="md">
            <VStack space="xs" className="flex-1">
              <Text className="text-sm text-gray-500">Total Contratos</Text>
              <Text className="text-xl font-bold text-purple-600">
                {stats.totalContracts}
              </Text>
            </VStack>
            
            <VStack space="xs" className="flex-1">
              <Text className="text-sm text-gray-500">Contratos Activos</Text>
              <Text className="text-xl font-bold text-orange-600">
                {stats.activeContracts}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </VStack>
    </Card>
  );
}