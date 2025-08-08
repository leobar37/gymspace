import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { router } from 'expo-router';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import { useCategoriesController } from '@/features/categories/controllers/categories.controller';
import { CategoryFormData } from '@/features/categories/controllers/categories.controller';

export default function NewCategoryScreen() {
  const toast = useToast();
  const { createCategory, isCreating } = useCategoriesController();

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      await createCategory(data);
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <View className="bg-green-500 px-4 py-3 rounded-lg">
            <Text className="text-white font-medium">
              Categoría creada exitosamente
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
              {error?.message || 'Error al crear la categoría'}
            </Text>
          </View>
        ),
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="md" className="p-4">
          <VStack space="sm" className="mb-4">
            <Text className="text-gray-600">
              Crea una nueva categoría para organizar tus productos
            </Text>
          </VStack>

          <Card className="p-4">
            <CategoryForm
              onSubmit={handleSubmit}
              isSubmitting={isCreating}
            />
          </Card>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}