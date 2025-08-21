import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { 
  EditIcon, 
  TrashIcon, 
  WrenchIcon,
  CalendarIcon,
  UserIcon,
} from 'lucide-react-native';
import { Spinner } from '@/components/ui/spinner';
import { useFormatPrice } from '@/config/ConfigContext';
import { useProduct } from '@/hooks/useProducts';
import { useProductsController } from '@/features/products/controllers/products.controller';
import { useLoadingScreen } from '@/shared/loading-screen';
import { 
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogFooter,
  AlertDialogBody,
} from '@/components/ui/alert-dialog';
import { Heading } from '@/components/ui/heading';
import { AssetPreview } from '@/features/assets/components/AssetPreview';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { execute } = useLoadingScreen();
  const formatPrice = useFormatPrice();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  
  const { data: service, isLoading } = useProduct(id);
  const { deleteProduct, toggleProductStatus } = useProductsController();

  const handleEdit = () => {
    router.push(`/inventory/services/${id}/edit`);
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    
    await execute(
      deleteProduct.mutateAsync(id),
      {
        action: 'Eliminando servicio...',
        successMessage: 'Servicio eliminado exitosamente',
        successActions: [
          {
            label: 'Ver servicios',
            onPress: () => {
              router.replace('/inventory/services');
            },
            variant: 'solid',
          },
        ],
        errorFormatter: (error) => {
          if (error instanceof Error) {
            return `Error al eliminar servicio: ${error.message}`;
          }
          return 'No se pudo eliminar el servicio. Por favor intente nuevamente.';
        },
        hideOnSuccess: false,
      }
    );
  };

  const handleToggleStatus = async () => {
    const isActivating = service?.status === 'inactive';
    
    await execute(
      toggleProductStatus.mutateAsync(id),
      {
        action: isActivating ? 'Activando servicio...' : 'Desactivando servicio...',
        successMessage: `Servicio ${isActivating ? 'activado' : 'desactivado'} exitosamente`,
        errorFormatter: (error) => {
          if (error instanceof Error) {
            return `Error al cambiar estado: ${error.message}`;
          }
          return 'No se pudo cambiar el estado del servicio. Por favor intente nuevamente.';
        },
      }
    );
  };

  if (isLoading || !service) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Spinner size="large" />
          <Text className="text-gray-600 mt-2">Cargando servicio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isInactive = service.status === 'inactive';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="flex-1">
          {/* Header Image */}
          <View className="h-48 bg-blue-50 items-center justify-center">
            {service.imageId ? (
              <AssetPreview
                assetId={service.imageId}
                size="large"
                resizeMode="cover"
              />
            ) : (
              <Icon as={WrenchIcon} className="w-20 h-20 text-blue-500" />
            )}
          </View>

          {/* Content */}
          <VStack space="md" className="px-4 py-4 bg-white">
            {/* Title and Status */}
            <VStack space="xs">
              <HStack className="items-start justify-between">
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900">
                    {service.name}
                  </Text>
                  {service.category && (
                    <Badge 
                      variant="outline"
                      size="sm"
                      className="self-start mt-2"
                      style={{ backgroundColor: service.category.color + '20' || '#dbeafe' }}
                    >
                      <BadgeText style={{ color: service.category.color || '#3b82f6' }}>
                        {service.category.name}
                      </BadgeText>
                    </Badge>
                  )}
                </View>
                <Badge 
                  variant={isInactive ? 'outline' : 'solid'}
                  className={isInactive ? 'bg-gray-100' : 'bg-green-500'}
                >
                  <BadgeText className={isInactive ? 'text-gray-600' : 'text-white'}>
                    {isInactive ? 'Inactivo' : 'Activo'}
                  </BadgeText>
                </Badge>
              </HStack>
            </VStack>

            {/* Price */}
            <View className="bg-blue-50 rounded-lg p-4">
              <Text className="text-sm text-blue-600 mb-1">Precio</Text>
              <Text className="text-2xl font-bold text-blue-700">
                {formatPrice(service.price)}
              </Text>
            </View>

            {/* Description */}
            {service.description && (
              <VStack space="xs">
                <Text className="text-sm font-medium text-gray-700">Descripción</Text>
                <Text className="text-gray-600">{service.description}</Text>
              </VStack>
            )}

            {/* Service Type Badge */}
            <HStack className="items-center">
              <Icon as={WrenchIcon} className="w-4 h-4 text-blue-500 mr-2" />
              <Text className="text-sm text-gray-600">Tipo: </Text>
              <Badge variant="outline" size="sm" className="bg-blue-50">
                <BadgeText className="text-blue-600">Servicio</BadgeText>
              </Badge>
            </HStack>

            {/* Metadata */}
            <VStack space="sm" className="mt-4 pt-4 border-t border-gray-200">
              {service.createdBy && (
                <HStack space="xs" className="items-center">
                  <Icon as={UserIcon} className="w-4 h-4 text-gray-400" />
                  <Text className="text-sm text-gray-600">
                    Creado por: {service.createdBy.name}
                  </Text>
                </HStack>
              )}
              
              <HStack space="xs" className="items-center">
                <Icon as={CalendarIcon} className="w-4 h-4 text-gray-400" />
                <Text className="text-sm text-gray-600">
                  Creado: {format(new Date(service.createdAt), 'dd MMM yyyy', { locale: es })}
                </Text>
              </HStack>

              {service.updatedBy && service.updatedAt !== service.createdAt && (
                <HStack space="xs" className="items-center">
                  <Icon as={CalendarIcon} className="w-4 h-4 text-gray-400" />
                  <Text className="text-sm text-gray-600">
                    Actualizado: {format(new Date(service.updatedAt), 'dd MMM yyyy', { locale: es })}
                  </Text>
                </HStack>
              )}
            </VStack>

            {/* Actions */}
            <VStack space="sm" className="mt-6">
              <Button onPress={handleToggleStatus} variant="outline">
                <ButtonText>
                  {isInactive ? 'Activar Servicio' : 'Desactivar Servicio'}
                </ButtonText>
              </Button>

              <HStack space="sm">
                <Button onPress={handleEdit} className="flex-1">
                  <ButtonIcon as={EditIcon} className="mr-2" />
                  <ButtonText>Editar</ButtonText>
                </Button>

                <Button 
                  onPress={() => setShowDeleteDialog(true)}
                  variant="outline"
                  className="flex-1 border-red-500"
                >
                  <ButtonIcon as={TrashIcon} className="text-red-500 mr-2" />
                  <ButtonText className="text-red-500">Eliminar</ButtonText>
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading>Eliminar Servicio</Heading>
            <AlertDialogCloseButton />
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>
              ¿Estás seguro de que deseas eliminar el servicio "{service.name}"? 
              Esta acción no se puede deshacer.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onPress={() => setShowDeleteDialog(false)}
              className="mr-3"
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              onPress={handleDelete}
              className="bg-red-500"
            >
              <ButtonText>Eliminar</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  );
}