import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useRequireAuth } from '@/controllers/auth.controller';
import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { CheckInButton } from './CheckInButton';
import { SalesButton } from './SalesButton';
import { TimeRange } from '@/components/TimeRange';
import { 
  useDashboardDateRangeManager,
  useExpiringContractsWidget 
} from '../hooks/useDashboardWidgets';
import {
  ContractsRevenueWidget,
  SalesRevenueWidget
} from './widgets/RevenueWidget';
import {
  DebtsWidget,
  CheckInsWidget,
  NewClientsWidget
} from './widgets/MetricsWidget';

export const Dashboard: React.FC = () => {
  // Check authentication and redirect if not authenticated
  const { isAuthenticated, isLoadingSession } = useRequireAuth();
  
  // Dashboard date range management
  const { dateRange, setDateRange } = useDashboardDateRangeManager();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // React Query will handle the actual refresh through invalidation
    setRefreshing(false);
  };

  const handleRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange(startDate, endDate);
  };

  // Show loading while checking authentication
  if (isLoadingSession) {
    return (
      <VStack className="flex-1 items-center justify-center bg-gray-50">
        <Spinner className="text-blue-600" />
        <Text className="text-gray-600 mt-2">Verificando sesión...</Text>
      </VStack>
    );
  }

  // If not authenticated, the useRequireAuth hook will redirect
  // So we can return null here to prevent flash of content
  if (!isAuthenticated) {
    return null;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <VStack className="p-4 gap-4">
          {/* Date Range Selector */}
          <TimeRange 
            onRangeChange={handleRangeChange} 
            hideLabel={true}
          />
          
          {/* Metrics Section - Primary Stats */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <CheckInsWidget />
            </View>
            <View className="flex-1">
              <NewClientsWidget />
            </View>
          </View>
          
          {/* Revenue Section */}
          <View className="mt-2">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Ingresos</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <ContractsRevenueWidget />
              </View>
              <View className="flex-1">
                <SalesRevenueWidget />
              </View>
            </View>
          </View>
          
          {/* Debts Widget */}
          <View className="mt-2">
            <DebtsWidget />
          </View>
        </VStack>
      </ScrollView>
      
      {/* Floating Action Buttons */}
      <CheckInButton />
      <SalesButton />
    </View>
  );
};