import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useFormatPrice } from '@/config/ConfigContext';
import { 
  useDebtsWidget, 
  useCheckInsWidget, 
  useNewClientsWidget 
} from '../../hooks/useDashboardWidgets';
import { AlertCircle, UserCheck, Users } from 'lucide-react-native';

export const DebtsWidget: React.FC = () => {
  const { data, isLoading, error } = useDebtsWidget();
  const formatPrice = useFormatPrice();

  if (isLoading) {
    return (
      <Card className="bg-white">
        <View className="p-4 items-center justify-center h-24">
          <Spinner size="small" />
        </View>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white">
        <View className="p-4">
          <Text className="text-red-500 text-sm">Error loading debts</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="bg-red-100 p-2 rounded-lg">
            <AlertCircle size={20} className="text-red-600" />
          </View>
          <Text className="text-sm font-medium text-gray-600">Deudas</Text>
        </View>
      </View>
      <Text className="text-2xl font-bold text-gray-900">
        {formatPrice(data?.total || 0)}
      </Text>
      <Text className="text-xs text-gray-500 mt-1">
        {data?.count || 0} clientes con deuda
      </Text>
    </Card>
  );
};

export const CheckInsWidget: React.FC = () => {
  const { data, isLoading, error } = useCheckInsWidget();

  if (isLoading) {
    return (
      <Card className="bg-white">
        <View className="p-4 items-center justify-center h-24">
          <Spinner size="small" />
        </View>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white">
        <View className="p-4">
          <Text className="text-red-500 text-sm">Error loading check-ins</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="bg-purple-100 p-2 rounded-lg">
            <UserCheck size={20} className="text-purple-600" />
          </View>
          <Text className="text-sm font-medium text-gray-600">Check-ins</Text>
        </View>
      </View>
      <Text className="text-2xl font-bold text-gray-900">
        {data?.total || 0}
      </Text>
      <Text className="text-xs text-gray-500 mt-1">
        {data?.today || 0} hoy
      </Text>
    </Card>
  );
};

export const NewClientsWidget: React.FC = () => {
  const { data, isLoading, error } = useNewClientsWidget();

  if (isLoading) {
    return (
      <Card className="bg-white">
        <View className="p-4 items-center justify-center h-24">
          <Spinner size="small" />
        </View>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white">
        <View className="p-4">
          <Text className="text-red-500 text-sm">Error loading clients</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="bg-teal-100 p-2 rounded-lg">
            <Users size={20} className="text-teal-600" />
          </View>
          <Text className="text-sm font-medium text-gray-600">Nuevos Clientes</Text>
        </View>
      </View>
      <Text className="text-2xl font-bold text-gray-900">
        {data?.count || 0}
      </Text>
      <Text className="text-xs text-gray-500 mt-1">
        en el período seleccionado
      </Text>
    </Card>
  );
};