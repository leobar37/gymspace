import { VStack } from '@/components/ui/vstack';
import { useFormatPrice } from '@/config/ConfigContext';
import { StatCard } from '@/shared/components';
import { router } from 'expo-router';
import {
  ActivityIcon,
  DollarSignIcon,
  FileTextIcon,
  UsersIcon,
} from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

interface Stats {
  activeClients: number;
  totalClients: number;
  todayCheckIns: number;
  activeContracts: number;
  totalContracts: number;
  monthlyRevenue: number;
}

interface StatsGridProps {
  stats: Stats;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const formatPrice = useFormatPrice();

  return (
    <VStack className="gap-4">
      <View className="flex-row flex-wrap -mx-2">
        <View className="w-1/2 px-2 mb-4">
          <StatCard
            title="Clientes Activos"
            value={stats?.activeClients || 0}
            subtitle={`de ${stats?.totalClients || 0} totales`}
            icon={UsersIcon}
            iconColor="bg-blue-600"
            onPress={() => router.push('/clients')}
          />
        </View>
        <View className="w-1/2 px-2 mb-4">
          <StatCard
            title="Check-ins Hoy"
            value={stats?.todayCheckIns || 0}
            icon={ActivityIcon}
            iconColor="bg-green-600"
          />
        </View>
        <View className="w-1/2 px-2 mb-4">
          <StatCard
            title="Contratos Activos"
            value={stats?.activeContracts || 0}
            subtitle={`de ${stats?.totalContracts || 0} totales`}
            icon={FileTextIcon}
            iconColor="bg-purple-600"
          />
        </View>
        <View className="w-1/2 px-2 mb-4">
          <StatCard
            title="Ingresos del Mes"
            value={formatPrice(stats?.monthlyRevenue || 0)}
            icon={DollarSignIcon}
            iconColor="bg-orange-600"
          />
        </View>
      </View>
    </VStack>
  );
};