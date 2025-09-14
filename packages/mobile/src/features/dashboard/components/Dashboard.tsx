import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { CheckInButton } from './CheckInButton';
import { TimeRange } from '@/components/TimeRange';
import { useDashboardDateRangeManager } from '../hooks/useDashboardWidgets';
import { ContractsRevenueWidget, SalesRevenueWidget } from './widgets/RevenueWidget';
import { DebtsWidget, CheckInsWidget, NewClientsWidget } from './widgets/MetricsWidget';
import { DataPrefetch } from './DataPrefetch';

const DashboardComponent: React.FC = () => {
  // Dashboard date range management
  const { setDateRange } = useDashboardDateRangeManager();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // React Query will handle the actual refresh through invalidation
    setRefreshing(false);
  };

  const handleRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange(startDate, endDate);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Prefetch data in background without blocking UI */}
      <DataPrefetch />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <VStack className="p-4 gap-4">
          {/* Date Range Selector */}
          <TimeRange onRangeChange={handleRangeChange} hideLabel={true} />

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
    </View>
  );
};

export const Dashboard = React.memo(DashboardComponent);
