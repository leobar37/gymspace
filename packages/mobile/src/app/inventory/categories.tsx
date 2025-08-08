import React from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { 
  PlusIcon, 
  TagIcon,
  EditIcon,
  TrashIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useCategoriesController } from '@/features/categories/controllers/categories.controller';
import { useCategoriesStore } from '@/features/categories/stores/categories.store';
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
import { useToast } from '@/components/ui/toast';

export default function CategoriesScreen() {
  const toast = useToast();
  const { useCategoriesList, deleteCategory, isDeleting } = useCategoriesController();
  const { data: categories, isLoading, error, refetch } = useCategoriesList();
  
  const { 
    isDeleteDialogOpen, 
    categoryToDelete, 
    openDeleteDialog, 
    closeDeleteDialog 
  } = useCategoriesStore();

  const handleAddCategory = () => {
    router.push('/inventory/categories/new');
  };

  const handleEditCategory = (categoryId: string) => {
    router.push(`/inventory/categories/${categoryId}/edit`);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteCategory(categoryToDelete.id);
      closeDeleteDialog();
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <View className="bg-green-500 px-4 py-3 rounded-lg">
            <Text className="text-white font-medium">
              Categoría eliminada exitosamente
            </Text>
          </View>
        ),
      });
    } catch (error) {
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <View className="bg-red-500 px-4 py-3 rounded-lg">
            <Text className="text-white font-medium">
              Error al eliminar la categoría
            </Text>
          </View>
        ),
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Cargando categorías...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-4">
          <Icon as={TagIcon} className="w-16 h-16 text-gray-400 mb-4" />
          <Text className="text-gray-800 text-lg font-semibold mb-2">
            Error al cargar categorías
          </Text>
          <Text className="text-gray-600 text-center mb-4">
            {error.message || 'Ocurrió un error al cargar las categorías'}
          </Text>
          <Button onPress={() => refetch()}>
            <ButtonText>Reintentar</ButtonText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const categoriesList = categories || [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="md" className="p-4">
          {/* Back Button */}
          <Pressable 
            onPress={() => router.push('/inventory')}
            className="flex-row items-center mb-2"
          >
            <Icon as={ArrowLeftIcon} className="w-5 h-5 text-gray-700 mr-2" />
            <Text className="text-gray-700 font-medium">Volver al Inventario</Text>
          </Pressable>

          {/* Header with Add Button */}
          <HStack className="justify-between items-center mb-2">
            <Text className="text-gray-800 text-xl font-bold">
              Categorías de Productos
            </Text>
            <Button 
              size="sm" 
              onPress={handleAddCategory}
              className="bg-blue-500"
            >
              <ButtonIcon as={PlusIcon} className="mr-2" />
              <ButtonText>Nueva</ButtonText>
            </Button>
          </HStack>

          {categoriesList.length === 0 ? (
            <Card className="p-8">
              <VStack space="md" className="items-center">
                <Icon as={TagIcon} className="w-16 h-16 text-gray-400" />
                <Text className="text-gray-800 text-lg font-semibold text-center">
                  No hay categorías
                </Text>
                <Text className="text-gray-600 text-center">
                  Crea tu primera categoría para organizar tus productos
                </Text>
                <Button onPress={handleAddCategory}>
                  <ButtonIcon as={PlusIcon} className="mr-2" />
                  <ButtonText>Crear Categoría</ButtonText>
                </Button>
              </VStack>
            </Card>
          ) : (
            <VStack space="sm">
              {categoriesList.map((category) => (
                <Card key={category.id}>
                  <Pressable className="p-4">
                    <HStack className="justify-between items-start">
                      <HStack space="md" className="items-start flex-1">
                        {category.color && (
                          <View 
                            className="w-12 h-12 rounded-lg"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        <VStack className="flex-1">
                          <Text className="text-gray-800 font-semibold text-base">
                            {category.name}
                          </Text>
                          {category.description && (
                            <Text className="text-gray-600 text-sm mt-1">
                              {category.description}
                            </Text>
                          )}
                          {category._count?.products !== undefined && (
                            <Text className="text-gray-500 text-xs mt-2">
                              {category._count.products} {category._count.products === 1 ? 'producto' : 'productos'}
                            </Text>
                          )}
                        </VStack>
                      </HStack>
                      
                      <HStack space="sm">
                        <Pressable
                          onPress={() => handleEditCategory(category.id)}
                          className="p-2"
                        >
                          <Icon as={EditIcon} className="w-5 h-5 text-blue-600" />
                        </Pressable>
                        <Pressable
                          onPress={() => openDeleteDialog(category)}
                          className="p-2"
                        >
                          <Icon as={TrashIcon} className="w-5 h-5 text-red-600" />
                        </Pressable>
                      </HStack>
                    </HStack>
                  </Pressable>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="lg">Eliminar Categoría</Heading>
            <AlertDialogCloseButton onPress={closeDeleteDialog}>
              <Icon as={ChevronRightIcon} />
            </AlertDialogCloseButton>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className="text-gray-700">
              ¿Estás seguro de que deseas eliminar la categoría "{categoryToDelete?.name}"?
            </Text>
            <Text className="text-red-600 mt-3 font-semibold">
              ⚠️ Atención: Al eliminar esta categoría, todos los productos asociados también serán eliminados.
            </Text>
            <Text className="text-gray-600 mt-2">
              Esta acción es irreversible.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack space="md">
              <Button
                variant="outline"
                action="secondary"
                onPress={closeDeleteDialog}
                disabled={isDeleting}
              >
                <ButtonText>Cancelar</ButtonText>
              </Button>
              <Button
                action="negative"
                onPress={handleDeleteCategory}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <ButtonText className="ml-2">Eliminando...</ButtonText>
                  </>
                ) : (
                  <ButtonText>Eliminar</ButtonText>
                )}
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  );
}