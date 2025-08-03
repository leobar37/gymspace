import React from 'react';
import { View, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import {
  VStack,
  HStack,
  Text,
  Card,
  Avatar,
  Badge,
  BadgeText,
  Spinner,
  Button,
  ButtonText,
  Icon,
  Divider,
} from '../../components/ui';
import {
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  FileTextIcon,
  ActivityIcon,
  EditIcon,
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { useClientDetail, useClientStats, toggleStatus, isTogglingStatus } = useClientsController();
  
  const { data: client, isLoading } = useClientDetail(id);
  const { data: stats } = useClientStats(id);

  const handleEdit = () => {
    router.push(`/clients/${id}/edit`);
  };

  const handleToggleStatus = () => {
    toggleStatus(id);
  };

  if (isLoading) {
    return (
      <VStack className="flex-1 items-center justify-center">
        <Spinner className="text-blue-600" />
        <Text className="text-gray-600 mt-2">Cargando cliente...</Text>
      </VStack>
    );
  }

  if (!client) {
    return (
      <VStack className="flex-1 items-center justify-center p-8">
        <Text className="text-gray-600">Cliente no encontrado</Text>
      </VStack>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: client.name,
          headerBackTitle: 'Clientes',
          headerRight: () => (
            <Button onPress={handleEdit} variant="link" className="p-0">
              <Icon as={EditIcon} className="w-5 h-5 text-blue-600" />
            </Button>
          ),
        }} 
      />
      
      <ScrollView className="flex-1 bg-gray-50">
        <VStack className="p-4 gap-4">
          {/* Client Header */}
          <Card className="p-6">
            <HStack className="items-center gap-4">
              <Avatar className="w-20 h-20 bg-blue-600">
                <Text className="text-white text-2xl font-semibold">
                  {client.name.split(' ').map((n: string) => n[0]).join('')}
                </Text>
              </Avatar>
              <VStack className="flex-1">
                <Text className="text-xl font-semibold text-gray-900">
                  {client.name}
                </Text>
                <Text className="text-sm text-gray-600">
                  Cliente #{client.clientNumber}
                </Text>
                <Badge
                  variant="solid"
                  action={client.status === 'active' ? 'success' : 'muted'}
                  className="mt-2 self-start"
                >
                  <BadgeText>{client.status === 'active' ? 'Activo' : 'Inactivo'}</BadgeText>
                </Badge>
              </VStack>
            </HStack>
          </Card>

          {/* Contact Information */}
          <Card className="p-4">
            <Text className="font-semibold text-gray-900 mb-3">
              Información de Contacto
            </Text>
            <VStack className="gap-3">
              {client.phone && (
                <HStack className="items-center gap-3">
                  <Icon as={PhoneIcon} className="w-4 h-4 text-gray-500" />
                  <Text className="text-gray-700">{client.phone}</Text>
                </HStack>
              )}
              {client.email && (
                <HStack className="items-center gap-3">
                  <Icon as={MailIcon} className="w-4 h-4 text-gray-500" />
                  <Text className="text-gray-700">{client.email}</Text>
                </HStack>
              )}
              <HStack className="items-center gap-3">
                <Icon as={CalendarIcon} className="w-4 h-4 text-gray-500" />
                <Text className="text-gray-700">
                  Nacimiento: {new Date(client.birthDate).toLocaleDateString()}
                </Text>
              </HStack>
            </VStack>
          </Card>

          {/* Statistics */}
          {stats && (
            <Card className="p-4">
              <Text className="font-semibold text-gray-900 mb-3">
                Estadísticas
              </Text>
              <View className="flex-row flex-wrap -mx-2">
                <View className="w-1/2 px-2 mb-3">
                  <VStack className="items-center p-3 bg-gray-50 rounded-lg">
                    <Text className="text-2xl font-bold text-gray-900">
                      {stats.activity.totalCheckIns}
                    </Text>
                    <Text className="text-xs text-gray-600">Check-ins Total</Text>
                  </VStack>
                </View>
                <View className="w-1/2 px-2 mb-3">
                  <VStack className="items-center p-3 bg-gray-50 rounded-lg">
                    <Text className="text-2xl font-bold text-gray-900">
                      {stats.activity.monthlyCheckIns}
                    </Text>
                    <Text className="text-xs text-gray-600">Check-ins Mes</Text>
                  </VStack>
                </View>
                <View className="w-1/2 px-2">
                  <VStack className="items-center p-3 bg-gray-50 rounded-lg">
                    <Text className="text-2xl font-bold text-gray-900">
                      {stats.contracts.active}
                    </Text>
                    <Text className="text-xs text-gray-600">Contratos Activos</Text>
                  </VStack>
                </View>
                <View className="w-1/2 px-2">
                  <VStack className="items-center p-3 bg-gray-50 rounded-lg">
                    <Text className="text-2xl font-bold text-gray-900">
                      ${stats.contracts.totalSpent}
                    </Text>
                    <Text className="text-xs text-gray-600">Total Gastado</Text>
                  </VStack>
                </View>
              </View>
            </Card>
          )}

          {/* Emergency Contact */}
          {(client.emergencyContactName || client.emergencyContactPhone) && (
            <Card className="p-4">
              <Text className="font-semibold text-gray-900 mb-3">
                Contacto de Emergencia
              </Text>
              <VStack className="gap-2">
                {client.emergencyContactName && (
                  <Text className="text-gray-700">{client.emergencyContactName}</Text>
                )}
                {client.emergencyContactPhone && (
                  <Text className="text-gray-600">{client.emergencyContactPhone}</Text>
                )}
              </VStack>
            </Card>
          )}

          {/* Medical Conditions */}
          {client.medicalConditions && (
            <Card className="p-4">
              <Text className="font-semibold text-gray-900 mb-3">
                Condiciones Médicas
              </Text>
              <Text className="text-gray-700">{client.medicalConditions}</Text>
            </Card>
          )}

          {/* Notes */}
          {client.notes && (
            <Card className="p-4">
              <Text className="font-semibold text-gray-900 mb-3">
                Notas
              </Text>
              <Text className="text-gray-700">{client.notes}</Text>
            </Card>
          )}

          {/* Actions */}
          <VStack className="gap-3 mt-4">
            <Button
              onPress={handleToggleStatus}
              variant={client.status === 'active' ? 'outline' : 'solid'}
              disabled={isTogglingStatus}
              className="w-full"
            >
              <ButtonText>
                {client.status === 'active' ? 'Desactivar Cliente' : 'Activar Cliente'}
              </ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </>
  );
}