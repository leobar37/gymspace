import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import { ClientCheckInsSection } from '@/features/clients/components/ClientCheckInsSection';
import { ClientStatisticsSection } from '@/features/clients/components/ClientStatisticsSection';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import { useAsset } from '@/features/assets/controllers/assets.controller';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogFooter,
  AlertDialogBody,
} from '@/components/ui/alert-dialog';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from '@/components/ui/actionsheet';
import {
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  EditIcon,
  MoreHorizontalIcon,
  TrashIcon,
  ChevronLeftIcon,
  UserIcon,
  CheckCircleIcon,
  BarChart3Icon,
  AlertTriangleIcon,
} from 'lucide-react-native';
import { router } from 'expo-router';

type TabType = 'info' | 'checkins' | 'stats';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [statusError, setStatusError] = useState<string | null>(null);
  
  const { 
    useClientDetail, 
    useClientStats, 
    toggleStatus, 
    isTogglingStatus
  } = useClientsController();
  
  const { data: client, isLoading } = useClientDetail(id);
  const { data: stats } = useClientStats(id);
  
  // Fetch the profile photo if it exists
  const { data: profilePhoto } = useAsset(
    client?.profilePhotoId || '',
    !!client?.profilePhotoId
  );

  const handleEdit = () => {
    router.push(`/clients/${id}/edit`);
  };

  const handleToggleStatus = async () => {
    setStatusError(null);
    try {
      await toggleStatus(id);
      setShowStatusAlert(false);
    } catch (error: any) {
      // Check for active contracts error
      if (error?.response?.data?.code === 'CANNOT_DEACTIVATE_CLIENT_WITH_ACTIVE_CONTRACTS') {
        setStatusError(error.response.data.message || 'No se puede desactivar el cliente porque tiene contratos activos.');
      } else {
        setStatusError('Ocurrió un error al cambiar el estado del cliente.');
      }
    }
  };

  const handleMorePress = () => {
    setShowActionsheet(true);
  };

  const handleEditFromMenu = () => {
    setShowActionsheet(false);
    handleEdit();
  };

  const handleToggleStatusPress = () => {
    setShowActionsheet(false);
    setShowStatusAlert(true);
  };

  const handleConfirmToggleStatus = () => {
    handleToggleStatus();
  };

  const handleCancelStatusChange = () => {
    setShowStatusAlert(false);
    setStatusError(null);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <VStack className="flex-1 items-center justify-center">
          <Spinner />
          <Text className="text-gray-600 mt-2">Cargando cliente...</Text>
        </VStack>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <VStack className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-600">Cliente no encontrado</Text>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <View className="bg-white border-b border-gray-200">
        <HStack className="items-center justify-between px-4 py-3">
          <HStack className="items-center flex-1">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <Icon as={ChevronLeftIcon} size="xl" />
            </Pressable>
            <Text className="text-lg font-semibold ml-2" numberOfLines={1}>
              {client.name}
            </Text>
          </HStack>
          <Pressable onPress={handleMorePress} className="p-2">
            <Icon as={MoreHorizontalIcon} />
          </Pressable>
        </HStack>
      </View>
      
      {/* Tab Navigation */}
      <View className="bg-white border-b border-gray-200">
        <HStack className="px-4">
          <Pressable 
            onPress={() => setActiveTab('info')}
            className={`flex-1 py-3 border-b-2 ${activeTab === 'info' ? 'border-blue-600' : 'border-transparent'}`}
          >
            <HStack className="items-center justify-center gap-2">
              <Icon 
                as={UserIcon} 
                className={`w-4 h-4 ${activeTab === 'info' ? 'text-blue-600' : 'text-gray-500'}`}
              />
              <Text className={`font-medium ${activeTab === 'info' ? 'text-blue-600' : 'text-gray-500'}`}>
                Información
              </Text>
            </HStack>
          </Pressable>
          
          <Pressable 
            onPress={() => setActiveTab('checkins')}
            className={`flex-1 py-3 border-b-2 ${activeTab === 'checkins' ? 'border-blue-600' : 'border-transparent'}`}
          >
            <HStack className="items-center justify-center gap-2">
              <Icon 
                as={CheckCircleIcon} 
                className={`w-4 h-4 ${activeTab === 'checkins' ? 'text-blue-600' : 'text-gray-500'}`}
              />
              <Text className={`font-medium ${activeTab === 'checkins' ? 'text-blue-600' : 'text-gray-500'}`}>
                Check-ins
              </Text>
            </HStack>
          </Pressable>
          
          <Pressable 
            onPress={() => setActiveTab('stats')}
            className={`flex-1 py-3 border-b-2 ${activeTab === 'stats' ? 'border-blue-600' : 'border-transparent'}`}
          >
            <HStack className="items-center justify-center gap-2">
              <Icon 
                as={BarChart3Icon} 
                className={`w-4 h-4 ${activeTab === 'stats' ? 'text-blue-600' : 'text-gray-500'}`}
              />
              <Text className={`font-medium ${activeTab === 'stats' ? 'text-blue-600' : 'text-gray-500'}`}>
                Estadísticas
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      </View>
      
      <ScrollView className="flex-1">
        <VStack className="p-4 gap-4">
          {/* Tab Content */}
          {activeTab === 'info' ? (
            <>
              {/* Client Header */}
              <Card className="p-6">
            <HStack className="items-center gap-4">
              <Avatar size="xl">
                {profilePhoto?.previewUrl ? (
                  <AvatarImage 
                    source={{ uri: profilePhoto.previewUrl }} 
                    alt={client.name}
                  />
                ) : null}
                <AvatarFallback>
                  <Text className="text-xl font-semibold text-gray-600">
                    {client.name.split(' ').map((n: string) => n[0]).join('')}
                  </Text>
                </AvatarFallback>
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
                    <Icon as={CalendarIcon} />
                    <Text className="text-gray-700">
                      Nacimiento: {new Date(client.birthDate).toLocaleDateString()}
                    </Text>
                  </HStack>
                </VStack>
              </Card>

              {/* Statistics section removed from Información tab - now only shown in Estadísticas tab */}


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
                  onPress={() => setShowStatusAlert(true)}
                  variant={client.status === 'active' ? 'solid' : 'solid'}
                  className={client.status === 'active' ? 'bg-red-600' : 'bg-green-600'}
                  disabled={isTogglingStatus}
                >
                  <ButtonText className="text-white">
                    {client.status === 'active' ? 'Desactivar Cliente' : 'Activar Cliente'}
                  </ButtonText>
                </Button>
              </VStack>
            </>
          ) : activeTab === 'checkins' ? (
            <ClientCheckInsSection clientId={id} />
          ) : (
            <ClientStatisticsSection clientId={id} stats={stats} isLoading={false} />
          )}
        </VStack>
      </ScrollView>

      {/* Action Sheet */}
      <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)} snapPoints={[30]}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          
          <ActionsheetItem onPress={handleEditFromMenu}>
            <Icon as={EditIcon} className="w-4 h-4 text-gray-500 mr-3" />
            <ActionsheetItemText>Editar</ActionsheetItemText>
          </ActionsheetItem>
          
          <ActionsheetItem onPress={handleToggleStatusPress}>
            <Icon as={TrashIcon} className="w-4 h-4 text-red-500 mr-3" />
            <ActionsheetItemText className="text-red-500">
              Eliminar
            </ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>

      {/* Status Change Confirmation Alert */}
      <AlertDialog isOpen={showStatusAlert} onClose={handleCancelStatusChange}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <HStack className="items-center gap-2">
              {statusError && (
                <Icon as={AlertTriangleIcon} className="w-5 h-5 text-red-500" />
              )}
              <Text className="text-lg font-semibold">
                {client?.status === 'active' ? 'Desactivar Cliente' : 'Activar Cliente'}
              </Text>
            </HStack>
            <AlertDialogCloseButton onPress={handleCancelStatusChange} />
          </AlertDialogHeader>
          <AlertDialogBody>
            {statusError ? (
              <VStack className="gap-3">
                <Text className="text-red-600 font-medium">
                  Error al cambiar el estado
                </Text>
                <Text className="text-gray-600">
                  {statusError}
                </Text>
                {statusError.includes('contratos activos') && (
                  <Card className="p-3 bg-yellow-50 border border-yellow-200">
                    <HStack className="items-start gap-2">
                      <Icon as={AlertTriangleIcon} className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <Text className="text-sm text-gray-700">
                        Para desactivar este cliente, primero debe cancelar o completar todos sus contratos activos.
                      </Text>
                    </HStack>
                  </Card>
                )}
              </VStack>
            ) : (
              <VStack className="gap-3">
                <Text className="text-gray-600">
                  {client?.status === 'active' 
                    ? `¿Estás seguro de que deseas desactivar a ${client?.name}?`
                    : `¿Estás seguro de que deseas activar a ${client?.name}?`
                  }
                </Text>
                <Text className="text-sm text-gray-500">
                  {client?.status === 'active'
                    ? 'El cliente no podrá acceder al gimnasio hasta que sea reactivado.'
                    : 'El cliente podrá acceder nuevamente al gimnasio.'
                  }
                </Text>
              </VStack>
            )}
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="outline" onPress={handleCancelStatusChange}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            {!statusError && (
              <Button 
                action={client?.status === 'active' ? 'negative' : 'positive'}
                onPress={handleConfirmToggleStatus}
                disabled={isTogglingStatus}
              >
                <ButtonText>
                  {client?.status === 'active' ? 'Desactivar' : 'Activar'}
                </ButtonText>
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  );
}