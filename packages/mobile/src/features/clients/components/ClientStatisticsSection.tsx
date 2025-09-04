import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useFormatPrice } from '@/config/ConfigContext';
import {
  ActivityIcon,
  CalendarIcon,
  CheckCircleIcon,
  DollarSignIcon,
  FileTextIcon,
  TrendingUpIcon,
  UserIcon
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';

interface ClientStatisticsProps {
  stats: any;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  trend
}) => {
  return (
    <Card className="p-4 bg-white">
      <VStack className="gap-3">
        <HStack className="items-center justify-between">
          <View className={`p-2 rounded-lg ${iconColor}`}>
            <Icon as={icon} className="w-5 h-5 text-white" />
          </View>
          {trend && (
            <HStack className="items-center gap-1">
              <Icon 
                as={TrendingUpIcon} 
                className={`w-4 h-4 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
              />
              <Text className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </Text>
            </HStack>
          )}
        </HStack>
        
        <VStack className="gap-1">
          <Text className="text-xs text-gray-600">{title}</Text>
          <Text className="text-2xl font-bold text-gray-900">{value}</Text>
          {subtitle && (
            <Text className="text-xs text-gray-500">{subtitle}</Text>
          )}
        </VStack>
      </VStack>
    </Card>
  );
};

export const ClientStatisticsSection: React.FC<ClientStatisticsProps> = ({ 
  stats,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <VStack className="items-center justify-center py-8">
        <Spinner className="text-blue-600" />
        <Text className="text-gray-600 mt-2">Cargando estadísticas...</Text>
      </VStack>
    );
  }

  if (!stats) {
    return (
      <Card className="p-8 bg-gray-50">
        <VStack className="items-center gap-2">
          <Icon as={ActivityIcon} className="w-12 h-12 text-gray-300" />
          <Text className="text-gray-600 text-center">
            No hay estadísticas disponibles
          </Text>
        </VStack>
      </Card>
    );
  }

  const formatPrice = useFormatPrice();

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <VStack className="gap-6">
        {/* Client Overview */}
        <VStack className="gap-3">
          <Heading className="text-lg font-semibold text-gray-900">
            Resumen del Cliente
          </Heading>
          
          <Card className="p-4 bg-blue-50 border border-blue-200">
            <VStack className="gap-3">
              <HStack className="items-center gap-3">
                <Icon as={UserIcon} className="w-5 h-5 text-blue-600" />
                <Text className="font-medium text-gray-900">
                  {stats.client?.name}
                </Text>
              </HStack>
              
              <HStack className="items-center justify-between">
                <VStack>
                  <Text className="text-xs text-gray-600">Estado</Text>
                  <Text className={`font-medium ${stats.client?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.client?.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Text>
                </VStack>
                
                <VStack>
                  <Text className="text-xs text-gray-600">Miembro desde</Text>
                  <Text className="font-medium text-gray-900">
                    {formatDate(stats.client?.registrationDate)}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Card>
        </VStack>

        {/* Activity Stats */}
        <VStack className="gap-3">
          <Heading className="text-lg font-semibold text-gray-900">
            Actividad
          </Heading>
          
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-4">
              <StatCard
                title="Check-ins Total"
                value={stats.activity?.totalCheckIns || 0}
                icon={CheckCircleIcon}
                iconColor="bg-green-600"
              />
            </View>
            
            <View className="w-1/2 px-2 mb-4">
              <StatCard
                title="Check-ins Este Mes"
                value={stats.activity?.monthlyCheckIns || 0}
                icon={CalendarIcon}
                iconColor="bg-blue-600"
              />
            </View>
            
            <View className="w-full px-2">
              <Card className="p-4 bg-white">
                <HStack className="items-center justify-between">
                  <VStack>
                    <Text className="text-xs text-gray-600">Último Check-in</Text>
                    <Text className="font-medium text-gray-900">
                      {stats.activity?.lastCheckIn ? formatDate(stats.activity.lastCheckIn) : 'Sin registros'}
                    </Text>
                  </VStack>
                  <Icon as={ActivityIcon} className="w-5 h-5 text-gray-400" />
                </HStack>
              </Card>
            </View>
          </View>
        </VStack>


        {/* Financial Stats */}
        <VStack className="gap-3">
          <Heading className="text-lg font-semibold text-gray-900">
            Información Financiera
          </Heading>
          
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-4">
              <StatCard
                title="Contratos Activos"
                value={stats.contracts?.active || 0}
                icon={FileTextIcon}
                iconColor="bg-purple-600"
              />
            </View>
            
            <View className="w-1/2 px-2 mb-4">
              <StatCard
                title="Total Gastado"
                value={formatPrice(stats.contracts?.totalSpent || 0)}
                icon={DollarSignIcon}
                iconColor="bg-orange-600"
              />
            </View>
          </View>
        </VStack>

        {/* Membership History */}
        {stats.membershipHistory && stats.membershipHistory.length > 0 && (
          <VStack className="gap-3">
            <Heading className="text-lg font-semibold text-gray-900">
              Historial de Membresías
            </Heading>
            
            <VStack className="gap-3">
              {stats.membershipHistory.map((membership: any) => (
                <Card key={membership.id} className="p-4 bg-white">
                  <VStack className="gap-2">
                    <HStack className="items-center justify-between">
                      <Text className="font-medium text-gray-900">
                        {membership.gymMembershipPlan?.name}
                      </Text>
                      <Text className={`text-xs px-2 py-1 rounded-full ${
                        membership.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {membership.status === 'active' ? 'Activo' : 'Finalizado'}
                      </Text>
                    </HStack>
                    
                    <HStack className="items-center gap-4">
                      <Text className="text-sm text-gray-600">
                        {formatDate(membership.startDate)} - {membership.endDate ? formatDate(membership.endDate) : 'Presente'}
                      </Text>
                      <Text className="text-sm font-medium text-gray-900">
                        {formatPrice(membership.gymMembershipPlan?.basePrice || 0)}/mes
                      </Text>
                    </HStack>
                  </VStack>
                </Card>
              ))}
            </VStack>
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
};