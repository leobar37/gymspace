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
    organization: {
      id: string;
      country: string;
      currency: string;
      timezone: string;
    };
    subscriptionPlan: {
      name: string;
      maxGyms: number;
      maxClientsPerGym: number;
      maxUsersPerGym: number;
    };
    usage: {
      gyms: {
        current: number;
        limit: number;
        percentage: number;
      };
      clients: {
        current: number;
        limit: number;
        percentage: number;
      };
      collaborators: {
        current: number;
        limit: number;
        percentage: number;
      };
    };
    metrics: {
      totalClients: number;
      activeContracts: number;
      totalCollaborators: number;
      gymsCount: number;
    };
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
                {stats.metrics.gymsCount}
              </Text>
            </VStack>
            
            <VStack space="xs" className="flex-1">
              <Text className="text-sm text-gray-500">Total Clientes</Text>
              <Text className="text-xl font-bold text-green-600">
                {stats.metrics.totalClients}
              </Text>
            </VStack>
          </HStack>
          
          <HStack space="md">
            <VStack space="xs" className="flex-1">
              <Text className="text-sm text-gray-500">Contratos Activos</Text>
              <Text className="text-xl font-bold text-purple-600">
                {stats.metrics.activeContracts}
              </Text>
            </VStack>
            
            <VStack space="xs" className="flex-1">
              <Text className="text-sm text-gray-500">Colaboradores</Text>
              <Text className="text-xl font-bold text-orange-600">
                {stats.metrics.totalCollaborators}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </VStack>
    </Card>
  );
}