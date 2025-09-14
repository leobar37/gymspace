import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useFormatPrice } from '@/config/ConfigContext';
import { useContractsRevenueWidget, useSalesRevenueWidget } from '../../hooks/useDashboardWidgets';
import { DollarSign, ShoppingCart } from 'lucide-react-native';

export const ContractsRevenueWidget: React.FC = () => {
  const { data, isLoading, error } = useContractsRevenueWidget();
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
          <Text className="text-red-500 text-sm">Error loading revenue</Text>
        </View>
      </Card>
    );
  }

  console.log("data", data);
  
  return (
    <Card className="bg-white p-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="bg-green-100 p-2 rounded-lg">
            <DollarSign size={20} className="text-green-600" />
          </View>
          <Text className="text-sm font-medium text-gray-600">Contratos</Text>
        </View>
      </View>
      <Text className="text-2xl font-bold text-gray-900">{formatPrice(data?.totalRevenue || 0)}</Text>
      <Text className="text-xs text-gray-500 mt-1">{data?.contractCount || 0} contratos</Text>
    </Card>
  );
};

export const SalesRevenueWidget: React.FC = () => {
  const { data, isLoading, error } = useSalesRevenueWidget();
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
          <Text className="text-red-500 text-sm">Error loading sales</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="bg-blue-100 p-2 rounded-lg">
            <ShoppingCart size={20} className="text-blue-600" />
          </View>
          <Text className="text-sm font-medium text-gray-600">Ventas</Text>
        </View>
      </View>
      <Text className="text-2xl font-bold text-gray-900">{formatPrice(data?.totalRevenue || 0)}</Text>
      <Text className="text-xs text-gray-500 mt-1">{data?.salesCount || 0} ventas</Text>
    </Card>
  );
};
