import React from 'react';
import { ScrollView, View, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  UserIcon,
  EditIcon,
  TrashIcon,
  ArrowLeftIcon,
  BuildingIcon,
  FileTextIcon,
} from 'lucide-react-native';
import { useSupplier, useDeleteSupplier } from '@/features/suppliers/controllers/suppliers.controller';

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: supplier, isLoading, isError } = useSupplier(id);
  const deleteMutation = useDeleteSupplier();

  const handleEdit = () => {
    router.push(`/suppliers/${id}/edit`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que deseas eliminar este proveedor?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync(id);
            router.back();
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Spinner size="large" />
          <Text className="mt-4 text-gray-600">Cargando proveedor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !supplier) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center p-4">
          <Icon as={BuildingIcon} className="w-16 h-16 text-gray-400 mb-4" />
          <Text className="text-lg text-gray-600 text-center">
            No se pudo cargar la información del proveedor
          </Text>
          <Button variant="outline" onPress={handleBack} className="mt-4">
            <ButtonText>Volver</ButtonText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* Header */}
      <HStack className="px-4 py-3 bg-white border-b border-gray-200 items-center">
        <Pressable onPress={handleBack} className="p-2">
          <Icon as={ArrowLeftIcon} className="w-6 h-6 text-gray-700" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-gray-900 ml-2">
          Detalles del Proveedor
        </Text>
        <HStack space="sm">
          <Button variant="ghost" size="sm" onPress={handleEdit}>
            <Icon as={EditIcon} className="w-5 h-5 text-blue-600" />
          </Button>
          <Button variant="ghost" size="sm" onPress={handleDelete}>
            <Icon as={TrashIcon} className="w-5 h-5 text-red-600" />
          </Button>
        </HStack>
      </HStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="lg" className="p-4">
          {/* Basic Information */}
          <Card className="bg-white">
            <VStack space="md" className="p-4">
              <HStack className="items-center justify-between">
                <Heading size="lg" className="text-gray-900">
                  {supplier.name}
                </Heading>
                <Badge 
                  variant="solid" 
                  action={supplier.active ? 'success' : 'muted'}
                >
                  <BadgeText>{supplier.active ? 'Activo' : 'Inactivo'}</BadgeText>
                </Badge>
              </HStack>

              {supplier.rfc && (
                <HStack space="sm" className="items-center">
                  <Icon as={FileTextIcon} className="w-5 h-5 text-gray-400" />
                  <VStack className="flex-1">
                    <Text className="text-xs text-gray-500">RFC</Text>
                    <Text className="text-gray-700">{supplier.rfc}</Text>
                  </VStack>
                </HStack>
              )}
            </VStack>
          </Card>

          {/* Contact Information */}
          <Card className="bg-white">
            <VStack space="md" className="p-4">
              <Heading size="md" className="text-gray-900">
                Información de Contacto
              </Heading>

              {supplier.phone && (
                <HStack space="sm" className="items-center">
                  <Icon as={PhoneIcon} className="w-5 h-5 text-gray-400" />
                  <VStack className="flex-1">
                    <Text className="text-xs text-gray-500">Teléfono</Text>
                    <Text className="text-gray-700">{supplier.phone}</Text>
                  </VStack>
                </HStack>
              )}

              {supplier.email && (
                <HStack space="sm" className="items-center">
                  <Icon as={MailIcon} className="w-5 h-5 text-gray-400" />
                  <VStack className="flex-1">
                    <Text className="text-xs text-gray-500">Email</Text>
                    <Text className="text-gray-700">{supplier.email}</Text>
                  </VStack>
                </HStack>
              )}

              {supplier.address && (
                <HStack space="sm" className="items-start">
                  <Icon as={MapPinIcon} className="w-5 h-5 text-gray-400 mt-1" />
                  <VStack className="flex-1">
                    <Text className="text-xs text-gray-500">Dirección</Text>
                    <Text className="text-gray-700">{supplier.address}</Text>
                  </VStack>
                </HStack>
              )}

              {supplier.contactName && (
                <HStack space="sm" className="items-center">
                  <Icon as={UserIcon} className="w-5 h-5 text-gray-400" />
                  <VStack className="flex-1">
                    <Text className="text-xs text-gray-500">Persona de Contacto</Text>
                    <Text className="text-gray-700">{supplier.contactName}</Text>
                  </VStack>
                </HStack>
              )}
            </VStack>
          </Card>

          {/* Notes */}
          {supplier.notes && (
            <Card className="bg-white">
              <VStack space="md" className="p-4">
                <Heading size="md" className="text-gray-900">
                  Notas
                </Heading>
                <Text className="text-gray-700">{supplier.notes}</Text>
              </VStack>
            </Card>
          )}

          {/* Actions */}
          <HStack space="sm">
            <Button
              variant="outline"
              onPress={handleBack}
              className="flex-1"
            >
              <ButtonText>Volver</ButtonText>
            </Button>
            <Button
              variant="solid"
              onPress={handleEdit}
              className="flex-1"
            >
              <ButtonText>Editar</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}