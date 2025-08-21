import React, { useEffect } from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert as UIAlert, AlertIcon, AlertText } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react-native';

// Hooks
import { useProduct, useUpdateProduct, useDeleteProduct, useUpdateStock } from '@/hooks/useProducts';
import { useProductDetailStore } from '@/features/inventory/stores/product-detail.store';

// Components
import { ProductForm } from '@/components/inventory/ProductForm';
import { ProductHeader } from '@/features/inventory/components/ProductHeader';
import { ProductImage } from '@/features/inventory/components/ProductImage';
import { ProductInfo } from '@/features/inventory/components/ProductInfo';
import { ProductStats } from '@/features/inventory/components/ProductStats';
import { StockAdjustment } from '@/features/inventory/components/StockAdjustment';

import type { UpdateProductDto } from '@gymspace/sdk';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    isEditing,
    setIsEditing,
    reset
  } = useProductDetailStore();

  // Queries and Mutations
  const { data: product, isLoading, isError, error, refetch } = useProduct(id!);
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const updateStockMutation = useUpdateStock();

  // Reset store on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // Handlers
  const handleUpdate = async (data: UpdateProductDto) => {
    try {
      await updateProductMutation.mutateAsync({
        id: id!,
        data
      });
      refetch()
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que deseas eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProductMutation.mutateAsync(id!);
              router.back();
            } catch (error) {
              console.error('Error deleting product:', error);
            }
          }
        }
      ]
    );
  };

  const handleStockAdjustment = async (adjustment: number) => {
    if (!product) return;

    const newStock = product.stock + adjustment;
    await updateStockMutation.mutateAsync({
      id: id!,
      quantity: newStock
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Spinner size="large" />
          <Text className="mt-4 text-gray-600">Cargando producto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !product) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <VStack space="md" className="p-4">
          <Button
            size="sm"
            onPress={() => router.back()}
            className="self-start mb-4 bg-gray-600"
          >
            <ButtonText className="text-white">Volver</ButtonText>
          </Button>

          <View className="flex-1 items-center justify-center">
            <UIAlert action="error" className="max-w-sm">
              <AlertIcon as={InfoIcon} />
              <AlertText>
                Error al cargar el producto: {error?.message || 'Producto no encontrado'}
              </AlertText>
            </UIAlert>
            <Button
              onPress={() => refetch()}
              className="mt-4 bg-blue-600"
            >
              <ButtonText className="text-white">Reintentar</ButtonText>
            </Button>
          </View>
        </VStack>
      </SafeAreaView>
    );
  }

  // Calculate product status
  const isInactive = product.status === 'inactive';
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  // Edit mode
  if (isEditing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <VStack className="flex-1">
          <ProductForm
            product={product}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isLoading={updateProductMutation.isPending}
          />
        </VStack>
      </SafeAreaView>
    );
  }

  // View mode
  return (
    <SafeAreaView className="flex-1" >
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="md" className="p-4">
          {/* Header with actions */}
          <ProductHeader
            onEdit={() => setIsEditing(true)}
            onDelete={handleDelete}
          />

          {/* Product Image */}
          <ProductImage
            imageId={product.imageId}
            productName={product.name}
          />

          {/* Product Info with embedded image */}
          <View className="bg-white rounded-lg shadow-sm -mt-4">
            <ProductInfo
              product={product}
              isInactive={isInactive}
              isOutOfStock={isOutOfStock}
              isLowStock={isLowStock}
            />
          </View>

          {/* Product Stats */}
          <ProductStats product={product} />

          {/* Stock Management */}
          <StockAdjustment
            product={product}
            isLowStock={isLowStock}
            onApplyAdjustment={handleStockAdjustment}
            isUpdating={updateStockMutation.isPending}
          />
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}