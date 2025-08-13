import { ProductForm } from '@/components/inventory/ProductForm';
import { VStack } from '@/components/ui/vstack';
import { useCreateProduct } from '@/hooks/useProducts';
import { useLoadingScreen } from '@/shared/loading-screen';
import type { CreateProductDto } from '@gymspace/sdk';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Alert } from 'react-native';

export default function NewProductScreen() {
  const createProductMutation = useCreateProduct();
  const { execute, hide } = useLoadingScreen();
  const createdProductRef = useRef<any>(null);

  const handleSubmit = async (data: CreateProductDto) => {
    await execute(
      createProductMutation.mutateAsync(data),
      {
        action: 'Creando producto...',
        successMessage: `El producto "${data.name}" ha sido creado exitosamente`,
        successActions: [
          {
            label: 'Ver producto',
            onPress: () => {
              hide();
              if (createdProductRef.current) {
                router.replace(`/inventory/products/${createdProductRef.current.id}`);
              }
            },
            variant: 'solid',
          },
          {
            label: 'Ir al listado',
            onPress: () => {
              hide();
              router.replace('/inventory/products');
            },
            variant: 'outline',
          },
        ],
        onSuccess: (newProduct) => {
          createdProductRef.current = newProduct;
        },
        errorFormatter: (error) => {
          if (error instanceof Error) {
            return `Error al crear el producto: ${error.message}`;
          }
          return 'No se pudo crear el producto. Por favor, intenta nuevamente.';
        },
        errorActions: [
          {
            label: 'Intentar de nuevo',
            onPress: () => {
              // Stay on the same screen to retry
            },
            variant: 'solid',
          },
          {
            label: 'Cancelar',
            onPress: () => {
              router.back();
            },
            variant: 'outline',
          },
        ],
        hideOnSuccess: false,
      }
    );
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