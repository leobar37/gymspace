import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useRequireAuth } from '@/controllers/auth.controller';
import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboardController } from '../controllers/dashboard.controller';
import { CheckInButton } from './CheckInButton';
import { ExpiringContractsAlert } from './ExpiringContractsAlert';
import { MonthlySummary } from './MonthlySummary';
import { RecentActivity } from './RecentActivity';
import { StatsGrid } from './StatsGrid';

export const Dashboard: React.FC = () => {
  // Check authentication and redirect if not authenticated
  const { isAuthenticated, isLoadingSession } = useRequireAuth();

  const { stats, isLoadingStats, recentActivity, refreshDashboard } = useDashboardController();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshDashboard();
    setRefreshing(false);
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

  if (isLoadingStats) {
    return (
      <VStack className="flex-1 items-center justify-center bg-gray-50">
        <Spinner className="text-blue-600" />
        <Text className="text-gray-600 mt-2">Cargando dashboard...</Text>
      </VStack>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <VStack className="p-4 gap-6">
          <Text className="text-gray-600 mb-2">
            {`Resumen de tu gimnasio al ${new Date().toLocaleDateString()}`}
          </Text>
          <StatsGrid stats={stats} />
          <ExpiringContractsAlert expiringContractsCount={stats?.expiringContractsCount || 0} />
          <RecentActivity recentActivity={recentActivity || []} />
          <MonthlySummary stats={stats} />
        </VStack>
      </ScrollView>
      {/* Floating Check-in Button */}
      <CheckInButton />
    </View>
  );
};
