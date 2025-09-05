import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { router } from 'expo-router';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import { useCategoriesController } from '@/features/categories/controllers/categories.controller';
import { CategoryFormData } from '@/features/categories/controllers/categories.controller';
import { useLoadingScreen } from '@/shared/loading-screen';

export default function NewCategoryScreen() {
  const { execute } = useLoadingScreen();
  const { createCategory, isCreating } = useCategoriesController();

  const handleSubmit = async (data: CategoryFormData) => {
    await execute(
      createCategory(data),
      {
        action: 'Creando categoría...',
        successMessage: 'Categoría creada exitosamente',
        successActions: [
          {
            label: 'Ver categorías',
            onPress: () => router.back(),
            variant: 'solid',
          },
        ],
        errorFormatter: (error: any) => error?.message || 'Error al crear la categoría',
        onSuccess: () => {
          router.back();
        },
      }
    );
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