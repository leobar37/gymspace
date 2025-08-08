import { ProductForm } from '@/components/inventory/ProductForm';
import { Button } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useCreateProduct } from '@/hooks/useProducts';
import type { CreateProductDto } from '@gymspace/sdk';
import { router } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import React from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewProductScreen() {
  const createProductMutation = useCreateProduct();

  const handleSubmit = async (data: CreateProductDto) => {
    try {
      const newProduct = await createProductMutation.mutateAsync(data);

      Alert.alert(
        'Producto creado',
        `El producto "${newProduct.name}" ha sido creado exitosamente.`,
        [
          {
            text: 'Ver producto',
            onPress: () => router.replace(`/inventory/products/${newProduct.id}`),
          },
          {
            text: 'Crear otro',
            onPress: () => router.replace('/inventory/products/new'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating product:', error);
      throw error; // Let the form handle the error
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar creación',
      '¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán.',
      [
        { text: 'Continuar editando', style: 'cancel' },
        {
          text: 'Cancelar',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <VStack className="flex-1">
      {/* Form */}
      <ProductForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createProductMutation.isPending}
      />
    </VStack>
  );
}