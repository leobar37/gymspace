import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
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
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const { 
    useClientDetail, 
    useClientStats, 
    toggleStatus, 
    isTogglingStatus
  } = useClientsController();
  
  const { data: client, isLoading } = useClientDetail(id);
  const { data: stats } = useClientStats(id);

  const handleEdit = () => {
    router.push(`/clients/${id}/edit`);
  };

  const handleToggleStatus = () => {
    toggleStatus(id);
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
    setShowDeleteAlert(true);
  };

  const handleConfirmToggleStatus = () => {
    toggleStatus(id);
    setShowDeleteAlert(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteAlert(false);
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
      
      <ScrollView className="flex-1">
        <VStack className="p-4 gap-4">
          {/* Client Header */}
          <Card className="p-6">
            <HStack className="items-center gap-4">
              <Avatar size="xl">
                <Text>
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
                  action={client.isActive ? 'success' : 'muted'}
                >
                  <BadgeText>{client.isActive ? 'Activo' : 'Inactivo'}</BadgeText>
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
                      {stats.totalCheckIns}
                    </Text>
                    <Text className="text-xs text-gray-600">Check-ins Total</Text>
                  </VStack>
                </View>
                <View className="w-1/2 px-2 mb-3">
                  <VStack className="items-center p-3 bg-gray-50 rounded-lg">
                    <Text className="text-2xl font-bold text-gray-900">
                      {stats.checkInsThisMonth}
                    </Text>
                    <Text className="text-xs text-gray-600">Check-ins Mes</Text>
                  </VStack>
                </View>
                <View className="w-1/2 px-2">
                  <VStack className="items-center p-3 bg-gray-50 rounded-lg">
                    <Text className="text-2xl font-bold text-gray-900">
                      {stats.activeContracts}
                    </Text>
                    <Text className="text-xs text-gray-600">Contratos Activos</Text>
                  </VStack>
                </View>
                <View className="w-1/2 px-2">
                  <VStack className="items-center p-3 bg-gray-50 rounded-lg">
                    <Text className="text-2xl font-bold text-gray-900">
                      {stats.totalEvaluations}
                    </Text>
                    <Text className="text-xs text-gray-600">Evaluaciones</Text>
                  </VStack>
                </View>
              </View>
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
              variant={client.isActive ? 'outline' : 'solid'}
              disabled={isTogglingStatus}
            >
              <ButtonText>
                {client.isActive ? 'Desactivar Cliente' : 'Activar Cliente'}
              </ButtonText>
            </Button>
          </VStack>
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

      {/* Delete Confirmation Alert */}
      <AlertDialog isOpen={showDeleteAlert} onClose={handleCancelDelete}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Text className="text-lg font-semibold">Eliminar Cliente</Text>
            <AlertDialogCloseButton onPress={handleCancelDelete} />
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className="text-gray-600">
              ¿Estás seguro de que deseas eliminar a {client?.name}?
            </Text>
            <Text className="text-sm text-gray-500 mt-2">
              Nota: El cliente será desactivado y no podrá acceder al gimnasio, pero su historial se mantendrá.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="outline" onPress={handleCancelDelete}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button 
              action="negative"
              onPress={handleConfirmToggleStatus}
              disabled={isTogglingStatus}
            >
              <ButtonText>
                Eliminar
              </ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  );
}