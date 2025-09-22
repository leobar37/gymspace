import { Button, ButtonText } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ClientActionSheet } from '@/features/clients/components/ClientActionSheet';
import { ClientCheckInsSection } from '@/features/clients/components/ClientCheckInsSection';
import { ClientContactInfo } from '@/features/clients/components/ClientContactInfo';
import { ClientHeader } from '@/features/clients/components/ClientHeader';
import { ClientNotes } from '@/features/clients/components/ClientNotes';
import { ClientStatisticsSection } from '@/features/clients/components/ClientStatisticsSection';
import { ClientStatusAlert } from '@/features/clients/components/ClientStatusAlert';
import {
  ClientTabNavigation,
  type TabType,
} from '@/features/clients/components/ClientTabNavigation';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import { useFile } from '@/features/files/controllers/files.controller';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [statusError, setStatusError] = useState<string | null>(null);

  const { useClientDetail, useClientStats, toggleStatus, isTogglingStatus } =
    useClientsController();

  const { data: client, isLoading } = useClientDetail(id);
  const { data: stats } = useClientStats(id);
  const { data: profilePhoto } = useFile(client?.profilePhotoId || '', !!client?.profilePhotoId);

  const handleEdit = useCallback(() => {
    router.push(`/clients/${id}/edit`);
  }, [id]);

  const handleToggleStatus = useCallback(async () => {
    setStatusError(null);
    try {
      await toggleStatus(id);
      setShowStatusAlert(false);
    } catch (error: any) {
      if (error?.response?.data?.code === 'CANNOT_DEACTIVATE_CLIENT_WITH_ACTIVE_CONTRACTS') {
        setStatusError(
          error.response.data.message ||
            'No se puede desactivar el cliente porque tiene contratos activos.',
        );
      } else {
        setStatusError('Ocurrió un error al cambiar el estado del cliente.');
      }
    }
  }, [id, toggleStatus]);

  const handleEditFromMenu = useCallback(() => {
    setShowActionsheet(false);
    handleEdit();
  }, [handleEdit]);

  const handleToggleStatusPress = useCallback(() => {
    setShowActionsheet(false);
    setShowStatusAlert(true);
  }, []);

  const handleCancelStatusChange = useCallback(() => {
    setShowStatusAlert(false);
    setStatusError(null);
  }, []);

  if (isLoading) {
    return <LoadingView />;
  }

  if (!client) {
    return <ClientNotFoundView />;
  }

  return (
    <View className="flex-1 bg-white">
      <Header
        clientName={client?.name}
        onBack={() => router.back()}
        onMore={() => setShowActionsheet(true)}
      />
      <ClientTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <ScrollView className="flex-1">
        <VStack className="px-4 pb-4 pt-2 gap-4">
          {activeTab === 'info' && (
            <InfoTab
              client={client}
              profilePhotoUrl={profilePhoto?.previewUrl}
              onEdit={handleEdit}
              onToggleStatus={() => setShowStatusAlert(true)}
              isTogglingStatus={isTogglingStatus}
            />
          )}
          {activeTab === 'checkins' && <ClientCheckInsSection clientId={id} />}
          {activeTab === 'stats' && <ClientStatisticsSection stats={stats} isLoading={false} />}
        </VStack>
      </ScrollView>

      <ClientActionSheet
        isOpen={showActionsheet}
        onClose={() => setShowActionsheet(false)}
        onEdit={handleEditFromMenu}
        onToggleStatus={handleToggleStatusPress}
      />

      <ClientStatusAlert
        isOpen={showStatusAlert}
        onClose={handleCancelStatusChange}
        onConfirm={handleToggleStatus}
        client={client}
        isToggling={isTogglingStatus}
        error={statusError}
      />
    </View>
  );
}

// Subcomponents
const LoadingView = () => (
  <SafeAreaView className="flex-1 bg-white">
    <VStack className="flex-1 items-center justify-center">
      <Spinner />
      <Text className="text-gray-600 mt-2">Cargando cliente...</Text>
    </VStack>
  </SafeAreaView>
);

const ClientNotFoundView = () => (
  <SafeAreaView className="flex-1 bg-white">
    <VStack className="flex-1 items-center justify-center p-8">
      <Text className="text-gray-600">Cliente no encontrado</Text>
    </VStack>
  </SafeAreaView>
);

interface HeaderProps {
  clientName?: string;
  onBack: () => void;
  onMore: () => void;
}

const Header: React.FC<HeaderProps> = ({ clientName }) => (
  <Stack.Screen
    options={{
      title: clientName || 'Cliente',
    }}
  />
);

interface InfoTabProps {
  client: any;
  profilePhotoUrl?: string;
  onEdit: () => void;
  onToggleStatus: () => void;
  isTogglingStatus: boolean;
}

const InfoTab: React.FC<InfoTabProps> = ({
  client,
  profilePhotoUrl,
  onEdit,
  onToggleStatus,
  isTogglingStatus,
}) => (
  <View>
    <ClientHeader client={client} profilePhotoUrl={profilePhotoUrl} onEdit={onEdit} />
    <ClientContactInfo phone={client.phone} email={client.email} birthDate={client.birthDate} />
    <ClientNotes notes={client.notes} />
    <VStack className="gap-3 mt-4">
      <Button
        onPress={onToggleStatus}
        variant="solid"
        action={client.status === 'active' ? 'negative' : 'positive'}
        disabled={isTogglingStatus}
      >
        <ButtonText>
          {client.status === 'active' ? 'Desactivar Cliente' : 'Activar Cliente'}
        </ButtonText>
      </Button>
    </VStack>
  </View>
);
