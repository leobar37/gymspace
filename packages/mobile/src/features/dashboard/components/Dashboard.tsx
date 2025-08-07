import React from 'react';
import { ScrollView, RefreshControl, View, Pressable } from 'react-native';
import { useDashboardController } from '../controllers/dashboard.controller';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Spinner } from '@/components/ui/spinner';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Divider } from '@/components/ui/divider';
import {
  UsersIcon,
  FileTextIcon,
  DollarSignIcon,
  ActivityIcon,
  AlertCircleIcon,
  UserPlusIcon,
  ClockIcon,
  CheckCircleIcon,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { CheckInButton } from './CheckInButton';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  iconColor: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  onPress,
}) => {
  const content = (
    <Card className="p-4 bg-white">
      <HStack className="items-center justify-between">
        <VStack className="flex-1">
          <Text className="text-sm text-gray-600 mb-1">{title}</Text>
          <Text className="text-2xl font-bold text-gray-900">{value}</Text>
          {subtitle && (
            <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>
          )}
        </VStack>
        <View className={`p-3 rounded-full ${iconColor}`}>
          <Icon as={icon} className="w-6 h-6 text-white" />
        </View>
      </HStack>
    </Card>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
};

interface ActivityItemProps {
  activity: any;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'check_in':
        return CheckCircleIcon;
      case 'new_client':
        return UserPlusIcon;
      case 'new_contract':
        return FileTextIcon;
      default:
        return ActivityIcon;
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case 'check_in':
        return 'text-green-600';
      case 'new_client':
        return 'text-blue-600';
      case 'new_contract':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)} horas`;
    return date.toLocaleDateString();
  };

  return (
    <HStack className="items-center gap-3 py-3">
      <Icon as={getActivityIcon()} className={`w-5 h-5 ${getActivityColor()}`} />
      <VStack className="flex-1">
        <Text className="text-sm font-medium text-gray-900">
          {activity.description}
        </Text>
        {activity.clientName && (
          <Text className="text-xs text-gray-600">{activity.clientName}</Text>
        )}
      </VStack>
      <Text className="text-xs text-gray-500">{formatTime(activity.timestamp)}</Text>
    </HStack>
  );
};

export const Dashboard: React.FC = () => {
  const {
    stats,
    isLoadingStats,
    recentActivity,
    expiringContracts,
    refreshDashboard,
  } = useDashboardController();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDashboard();
    setRefreshing(false);
  };

  if (isLoadingStats) {
    return (
      <VStack className="flex-1 items-center justify-center bg-gray-50">
        <Spinner className="text-blue-600" />
        <Text className="text-gray-600 mt-2">Cargando dashboard...</Text>
      </VStack>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <VStack className="p-4 gap-6">
        <VStack className="gap-1">
          <Heading className="text-2xl font-bold text-gray-900">
            Panel de Control
          </Heading>
          <Text className="text-gray-600">
            {`Resumen de tu gimnasio al ${new Date().toLocaleDateString()}`}
          </Text>
        </VStack>

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
                value={`$${stats?.monthlyRevenue?.toFixed(2) || '0.00'}`}
                icon={DollarSignIcon}
                iconColor="bg-orange-600"
              />
            </View>
          </View>
        </VStack>

        {stats?.expiringContractsCount && stats.expiringContractsCount > 0 && (
          <Card className="p-4 bg-yellow-50 border border-yellow-200">
            <HStack className="items-center gap-3">
              <Icon as={AlertCircleIcon} className="w-5 h-5 text-yellow-600" />
              <VStack className="flex-1">
                <Text className="font-medium text-gray-900">
                  Contratos por vencer
                </Text>
                <Text className="text-sm text-gray-600">
                  {stats.expiringContractsCount} contratos vencen en los próximos 30 días
                </Text>
              </VStack>
              <Pressable onPress={() => router.push('/contracts/expiring')}>
                <Text className="text-sm font-medium text-blue-600">Ver todos</Text>
              </Pressable>
            </HStack>
          </Card>
        )}

        <Card className="p-4">
          <VStack className="gap-3">
            <HStack className="items-center justify-between mb-2">
              <Heading className="text-lg font-semibold text-gray-900">
                Actividad Reciente
              </Heading>
              <Icon as={ClockIcon} className="w-5 h-5 text-gray-400" />
            </HStack>
            
            {recentActivity && recentActivity.length > 0 ? (
              <>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ActivityItem activity={activity} />
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </>
            ) : (
              <Text className="text-center text-gray-500 py-4">
                No hay actividad reciente
              </Text>
            )}
          </VStack>
        </Card>

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
      </VStack>
    </ScrollView>
    
    {/* Floating Check-in Button */}
    <CheckInButton />
    </View>
  );
};