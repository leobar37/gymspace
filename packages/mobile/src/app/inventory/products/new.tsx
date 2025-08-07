import React from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ArrowLeftIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCreateProduct } from '@/hooks/useProducts';
import { ProductForm } from '@/components/inventory/ProductForm';
import type { CreateProductDto } from '@gymspace/sdk';

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
    <SafeAreaView className="flex-1 bg-gray-50">
      <VStack className="flex-1">
        {/* Header */}
        <HStack className="justify-between items-center p-4 bg-white border-b border-gray-200">
          <HStack space="md" className="items-center">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
            >
              <Icon as={ArrowLeftIcon} className="w-5 h-5 text-gray-600" />
            </Button>
            <Text className="text-xl font-semibold text-gray-900">
              Nuevo Producto
            </Text>
          </HStack>
        </HStack>

        {/* Form */}
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createProductMutation.isPending}
        />
      </VStack>
    </SafeAreaView>
  );
}