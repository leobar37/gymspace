import React from 'react';
import { ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import {
  useOrganization,
  useOrganizationStats,
} from '@/features/organizations/controllers/organizations.controller';
import { OrganizationInfoCard, OrganizationStatsCard } from '@/features/organizations';
import { useOrganizationGyms } from '@/features/gyms/controllers/gyms.controller';
import { Spinner } from '@/components/ui/spinner';
import { Icon } from '@/components/ui/icon';
import { Building2, ChevronLeft, Building, Plus, ChevronRight } from 'lucide-react-native';

export default function OrganizationScreen() {
  const router = useRouter();
  const { organization, isLoading: sessionLoading, refetchSession } = useCurrentSession();

  const {
    data: organizationData,
    isLoading: orgLoading,
    refetch: refetchOrganization,
  } = useOrganization(organization?.id || '');

  const { data: organizationStats, isLoading: statsLoading } = useOrganizationStats(
    organization?.id || '',
  );

  const {
    data: organizationGyms,
    isLoading: gymsLoading,
    refetch: refetchGyms,
  } = useOrganizationGyms();

  const isLoading = sessionLoading || orgLoading || statsLoading || gymsLoading;

  const handleRefresh = async () => {
    await Promise.all([refetchSession(), refetchOrganization(), refetchGyms()]);
  };

  const handleAddGym = () => {
    Alert.alert('Agregar Gimnasio', '¿Deseas crear un nuevo gimnasio para tu organización?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Crear',
        onPress: () => {
          // Navigate to gym creation screen
          router.push('/gym/create');
        },
      },
    ]);
  };

  const handleEditOrganization = () => {
    router.push('/gym/organization/edit');
  };

  if (isLoading && !organizationData) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Spinner size="large" />
        <Text className="mt-4 text-gray-600">Cargando información...</Text>
      </View>
    );
  }

  if (!organization || !organizationData) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <VStack space="lg" className="items-center">
          <Icon as={Building} size="xl" className="text-gray-400" />
          <Text className="text-lg text-center text-gray-700">
            No se pudo cargar la información de la organización
          </Text>
          <Button onPress={handleRefresh}>
            <ButtonText>Reintentar</ButtonText>
          </Button>
        </VStack>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Mi Organización',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2">
              <Icon as={ChevronLeft} className="w-6 h-6 text-gray-700" />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <VStack className="p-4 pb-8" space="md">
          {/* Organization Summary */}
          <OrganizationInfoCard organization={organizationData} onEdit={handleEditOrganization} />

          {/* Organization Stats */}
          {organizationStats && <OrganizationStatsCard stats={organizationStats as any} />}

          {/* Gyms Section */}
          <Card className="p-4 bg-white rounded-xl shadow-sm">
            <VStack space="md">
              <HStack className="items-center justify-between">
                <HStack className="items-center" space="sm">
                  <Icon as={Building2} size="sm" className="text-gray-500" />
                  <Text className="text-lg font-semibold text-gray-900">Gimnasios</Text>
                </HStack>
              </HStack>

              {organizationGyms && organizationGyms.length > 0 ? (
                <VStack space="sm">
                  {organizationGyms.map((gym) => (
                    <Pressable
                      key={gym.id}
                      onPress={() => {
                        // Navigate to gym details
                        router.push(`/gym/${gym.id}`);
                      }}
                      className="flex-row items-center justify-between py-3 px-2 rounded-lg bg-gray-50 active:bg-gray-100"
                    >
                      <HStack className="items-center flex-1" space="sm">
                        <Icon as={Building2} size="sm" className="text-blue-600" />
                        <VStack className="flex-1">
                          <Text className="text-base font-medium text-gray-900">{gym.name}</Text>
                          {gym.address && (
                            <Text className="text-sm text-gray-500">{gym.address}</Text>
                          )}
                          <HStack className="items-center" space="xs">
                            <View
                              className={`w-2 h-2 rounded-full ${
                                gym.isActive ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                            <Text className="text-xs text-gray-500 capitalize">
                              {gym.isActive ? 'Activo' : 'Inactivo'}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                      <Icon as={ChevronRight} size="sm" className="text-gray-400" />
                    </Pressable>
                  ))}
                </VStack>
              ) : (
                <VStack space="lg" className="items-center py-8">
                  <Icon as={Building2} size="xl" className="text-gray-300" />
                  <VStack space="sm" className="items-center">
                    <Text className="text-base font-medium text-gray-700">
                      No hay gimnasios registrados
                    </Text>
                    <Text className="text-sm text-center text-gray-500">
                      Crea tu primer gimnasio para comenzar a gestionar clientes y servicios
                    </Text>
                  </VStack>
                  <Button variant="outline" onPress={handleAddGym}>
                    <HStack className="items-center" space="xs">
                      <Icon as={Plus} size="sm" />
                      <ButtonText>Crear Primer Gimnasio</ButtonText>
                    </HStack>
                  </Button>
                </VStack>
              )}
            </VStack>
          </Card>
        </VStack>
      </ScrollView>
    </>
  );
}
