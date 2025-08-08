import React, { useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { router, useLocalSearchParams } from 'expo-router';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import { useCategoriesController } from '@/features/categories/controllers/categories.controller';
import { CategoryFormData } from '@/features/categories/controllers/categories.controller';
import { ProductCategory } from '@gymspace/sdk';
import { Icon } from '@/components/ui/icon';
import { TagIcon } from 'lucide-react-native';

export default function EditCategoryScreen() {
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateCategory, isUpdating, useCategoriesList } = useCategoriesController();
  const { data: categories, isLoading } = useCategoriesList();
  const [category, setCategory] = useState<ProductCategory | null>(null);

  useEffect(() => {
    if (categories && id) {
      const foundCategory = categories.find(cat => cat.id === id);
      if (foundCategory) {
        setCategory(foundCategory);
      }
    }
  }, [categories, id]);

  const handleSubmit = async (data: CategoryFormData) => {
    if (!id) return;

    try {
      await updateCategory({ id, data });
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <View className="bg-green-500 px-4 py-3 rounded-lg">
            <Text className="text-white font-medium">
              Categoría actualizada exitosamente
            </Text>
          </View>
        ),
      });
      router.back();
    } catch (error: any) {
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <View className="bg-red-500 px-4 py-3 rounded-lg">
            <Text className="text-white font-medium">
              {error?.message || 'Error al actualizar la categoría'}
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
          <Text className="text-gray-600 mt-4">Cargando categoría...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-4">
          <Icon as={TagIcon} className="w-16 h-16 text-gray-400 mb-4" />
          <Text className="text-gray-800 text-lg font-semibold mb-2">
            Categoría no encontrada
          </Text>
          <Text className="text-gray-600 text-center">
            La categoría que intentas editar no existe
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="md" className="p-4">
          <VStack space="sm" className="mb-4">
            <Text className="text-gray-600">
              Modifica los datos de la categoría
            </Text>
          </VStack>

          <Card className="p-4">
            <CategoryForm
              initialData={category}
              onSubmit={handleSubmit}
              isSubmitting={isUpdating}
            />
          </Card>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}