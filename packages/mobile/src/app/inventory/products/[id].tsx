import React from 'react';
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
import {
  useProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/features/products/hooks/useProducts';
import { useProductDetailStore } from '@/features/inventory/stores/product-detail.store';

// Components
import { ProductForm } from '@/components/inventory/ProductForm';
import { ProductHeader } from '@/features/inventory/components/ProductHeader';
import { ProductImage } from '@/features/inventory/components/ProductImage';
import { ProductInfo } from '@/features/inventory/components/ProductInfo';
import { ProductStats } from '@/features/inventory/components/ProductStats';
import { StockAdjustment } from '@/features/inventory/components/StockAdjustment';
import { StockMovementsSection } from '@/features/inventory/components/StockMovementsSection';

import type { UpdateProductDto } from '@gymspace/sdk';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isEditing, setIsEditing } = useProductDetailStore();

  // Queries and Mutations
  const { data: product, isLoading, isError, error, refetch } = useProduct(id!);
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Handlers
  const handleUpdate = async (data: UpdateProductDto) => {
    try {
      await updateProductMutation.mutateAsync({
        id: id!,
        data,
      });
      refetch();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirmar Eliminación', '¿Estás seguro de que deseas eliminar este producto?', [
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
        },
      },
    ]);
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
          <Button size="sm" onPress={() => router.back()} className="self-start mb-4 bg-gray-600">
            <ButtonText className="text-white">Volver</ButtonText>
          </Button>

          <View className="flex-1 items-center justify-center">
            <UIAlert action="error" className="max-w-sm">
              <AlertIcon as={InfoIcon} />
              <AlertText>
                Error al cargar el producto: {error?.message || 'Producto no encontrado'}
              </AlertText>
            </UIAlert>
            <Button onPress={() => refetch()} className="mt-4 bg-blue-600">
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
  const isLowStock = product.minStock ? product.stock > 0 && product.stock <= product.minStock : product.stock > 0 && product.stock <= 10;

  // Edit mode
  if (isEditing) {
    return (
      <SafeAreaView className="flex-1 bg-white">
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} className="bg-white">
        <VStack className="px-3 py-4">
          {/* Header with actions */}
          <ProductHeader onEdit={() => setIsEditing(true)} onDelete={handleDelete} />

          {/* Product Image */}
          <View className="mt-4">
            <ProductImage imageId={product.imageId} productName={product.name} />
          </View>

          {/* Product Info */}
          <View className="-mt-4 mb-6">
            <ProductInfo
              product={product}
              isInactive={isInactive}
              isOutOfStock={isOutOfStock}
              isLowStock={isLowStock}
            />
          </View>

          {/* Separator */}
          <View className="h-px bg-gray-200 mx-2 mb-6" />

          {/* Product Stats */}
          <View className="mb-6">
            <ProductStats product={product} />
          </View>

          {/* Separator */}
          <View className="h-px bg-gray-200 mx-2 mb-6" />

          {/* Stock Management */}
          <View className="mb-6">
            <StockAdjustment product={product} isLowStock={isLowStock} />
          </View>
          
          {/* Separator */}
          <View className="h-px bg-gray-200 mx-2 mb-6" />

          {/* Stock Movements */}
          <StockMovementsSection product={product} />
          
          {/* Bottom padding */}
          <View className="h-8" />
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
