import { ProductForm } from '@/components/inventory/ProductForm';
import { AlertIcon, AlertText, Alert as UIAlert } from '@/components/ui/alert';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { useFormatPrice } from '@/config/ConfigContext';
import { AssetPreview } from '@/features/assets/components/AssetPreview';
import { useDeleteProduct, useProduct, useUpdateProduct, useUpdateStock } from '@/hooks/useProducts';
import type { UpdateProductDto } from '@gymspace/sdk';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  DollarSignIcon,
  EditIcon,
  HashIcon,
  InfoIcon,
  MinusIcon,
  PackageIcon,
  PlusIcon,
  TagIcon,
  TrashIcon
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const formatPrice = useFormatPrice();

  const [isEditing, setIsEditing] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState(0);

  const { data: product, isLoading, isError, error, refetch } = useProduct(id!);
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const updateStockMutation = useUpdateStock();

  const handleUpdate = async (data: UpdateProductDto) => {
    try {
      const updatedProduct = await updateProductMutation.mutateAsync({
        id: id!,
        data,
      });

      Alert.alert(
        'Producto actualizado',
        `El producto "${updatedProduct.name}" ha sido actualizado exitosamente.`
      );

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error; // Let the form handle the error
    }
  };

  const handleDelete = () => {
    if (!product) return;

    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProductMutation.mutateAsync(id!);
              Alert.alert('Producto eliminado', 'El producto ha sido eliminado exitosamente.');
              router.replace('/inventory/products');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert(
                'Error',
                'No se pudo eliminar el producto. Por favor intenta nuevamente.'
              );
            }
          },
        },
      ]
    );
  };

  const handleStockAdjustment = async () => {
    if (!product || stockAdjustment === 0) return;

    const newStock = product.stock + stockAdjustment;

    if (newStock < 0) {
      Alert.alert('Error', 'El stock no puede ser negativo.');
      return;
    }

    try {
      await updateStockMutation.mutateAsync({
        id: id!,
        quantity: newStock,
      });

      Alert.alert(
        'Stock actualizado',
        `Stock actualizado a ${newStock} unidades.`
      );

      setShowStockAdjustment(false);
      setStockAdjustment(0);
    } catch (error) {
      console.error('Error updating stock:', error);
      Alert.alert(
        'Error',
        'No se pudo actualizar el stock. Por favor intenta nuevamente.'
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Spinner size="large" />
          <Text className="text-gray-600 mt-4">Cargando producto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !product) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <VStack className="flex-1 p-4">
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.back()}
            className="self-start mb-4"
          >
            <Icon as={ArrowLeftIcon} className="w-4 h-4 text-gray-600 mr-2" />
            <ButtonText className="text-gray-600">Volver</ButtonText>
          </Button>

          <View className="flex-1 items-center justify-center">
            <UIAlert action="error" variant="solid" className="max-w-sm">
              <AlertIcon as={InfoIcon} />
              <AlertText>
                Error al cargar el producto: {error?.message || 'Producto no encontrado'}
              </AlertText>
            </UIAlert>
            <Button
              variant="outline"
              onPress={() => refetch()}
              className="mt-4"
            >
              <ButtonText>Reintentar</ButtonText>
            </Button>
          </View>
        </VStack>
      </SafeAreaView>
    );
  }

  const isLowStock = product.stock <= 10;
  const isOutOfStock = product.stock <= 0;
  const isInactive = product.status === 'inactive';

  if (isEditing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <VStack className="flex-1">
          {/* Header */}
          <HStack className="justify-between items-center p-4 bg-white border-b border-gray-200">
            <HStack space="md" className="items-center">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setIsEditing(false)}
              >
                <Icon as={ArrowLeftIcon} className="w-5 h-5 text-gray-600" />
              </Button>
              <Text className="text-xl font-semibold text-gray-900">
                Editar Producto
              </Text>
            </HStack>
          </HStack>

          {/* Form */}
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="md" className="p-4">
          {/* Header */}
          <HStack className="justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onPress={() => router.back()}
            >
              <Icon as={ArrowLeftIcon} className="w-4 h-4 text-gray-600 mr-2" />
              <ButtonText className="text-gray-600">Volver</ButtonText>
            </Button>

            <HStack space="xs">
              <Button
                variant="outline"
                size="sm"
                onPress={() => setIsEditing(true)}
              >
                <Icon as={EditIcon} className="w-4 h-4 text-gray-600 mr-1" />
                <ButtonText className="text-gray-600">Editar</ButtonText>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onPress={handleDelete}
                className="border-red-300"
              >
                <Icon as={TrashIcon} className="w-4 h-4 text-red-600 mr-1" />
                <ButtonText className="text-red-600">Eliminar</ButtonText>
              </Button>
            </HStack>
          </HStack>

          {/* Product Image */}
          <Card className="bg-white border border-gray-200">
            <View className="h-48 bg-gray-100 rounded-t-lg items-center justify-center">
              {product.imageId ? (
                <AssetPreview
                  assetId={product.imageId}
                  width={undefined}
                  height={192}
                  className="w-full rounded-t-lg"
                  resizeMode="contain"
                />
              ) : (
                <Icon as={PackageIcon} className="w-16 h-16 text-gray-400" />
              )}
            </View>

            <VStack space="sm" className="p-4">
              {/* Product Name and Status */}
              <HStack className="justify-between items-start">
                <VStack className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900">
                    {product.name}
                  </Text>
                  {product.category && (
                    <HStack space="xs" className="items-center mt-1">
                      <Icon as={TagIcon} className="w-4 h-4 text-gray-500" />
                      <Badge
                        variant="outline"
                        size="sm"
                        style={{ backgroundColor: product.category.color + '20' || '#f3f4f6' }}
                      >
                        <BadgeText style={{ color: product.category.color || '#6b7280' }}>
                          {product.category.name}
                        </BadgeText>
                      </Badge>
                    </HStack>
                  )}
                </VStack>

                <VStack space="xs" className="items-end">
                  <Badge
                    variant={isInactive ? "solid" : "outline"}
                    className={isInactive ? 'bg-gray-500' : 'bg-green-100 border-green-200'}
                  >
                    <BadgeText className={isInactive ? 'text-white' : 'text-green-700'}>
                      {isInactive ? 'Inactivo' : 'Activo'}
                    </BadgeText>
                  </Badge>

                  {isOutOfStock && (
                    <Badge variant="solid" className="bg-red-500">
                      <BadgeText className="text-white">Sin Stock</BadgeText>
                    </Badge>
                  )}

                  {!isOutOfStock && isLowStock && (
                    <Badge variant="solid" className="bg-orange-500">
                      <BadgeText className="text-white">Stock Bajo</BadgeText>
                    </Badge>
                  )}
                </VStack>
              </HStack>

              {/* Description */}
              {product.description && (
                <Text className="text-gray-600">
                  {product.description}
                </Text>
              )}
            </VStack>
          </Card>

          {/* Price and Stock Info */}
          <HStack space="md">
            <Card className="flex-1 bg-white border border-gray-200">
              <VStack space="xs" className="p-4 items-center">
                <Icon as={DollarSignIcon} className="w-8 h-8 text-blue-600" />
                <Text className="text-gray-600 text-sm">Precio</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </Text>
              </VStack>
            </Card>

            <Card className="flex-1 bg-white border border-gray-200">
              <VStack space="xs" className="p-4 items-center">
                <Icon
                  as={HashIcon}
                  className={`w-8 h-8 ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'
                    }`}
                />
                <Text className="text-gray-600 text-sm">Stock</Text>
                <Text className={`text-2xl font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-gray-900'
                  }`}>
                  {product.stock}
                </Text>
              </VStack>
            </Card>
          </HStack>

          {/* Stock Adjustment */}
          <Card className="bg-white border border-gray-200">
            <VStack space="md" className="p-4">
              <HStack className="justify-between items-center">
                <Text className="text-lg font-semibold text-gray-900">
                  Ajustar Stock
                </Text>

                {!showStockAdjustment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => setShowStockAdjustment(true)}
                  >
                    <Icon as={EditIcon} className="w-4 h-4 text-gray-600 mr-1" />
                    <ButtonText className="text-gray-600">Ajustar</ButtonText>
                  </Button>
                )}
              </HStack>

              {showStockAdjustment && (
                <VStack space="md">
                  <HStack space="md" className="items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => setStockAdjustment(prev => prev - 1)}
                      className="bg-red-50 border-red-300"
                    >
                      <Icon as={MinusIcon} className="w-4 h-4 text-red-600" />
                    </Button>

                    <VStack className="flex-1 items-center">
                      <Text className="text-sm text-gray-600">Ajuste</Text>
                      <Text className={`text-2xl font-bold ${stockAdjustment > 0 ? 'text-green-600' :
                          stockAdjustment < 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                        {stockAdjustment > 0 ? '+' : ''}{stockAdjustment}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        Nuevo stock: {product.stock + stockAdjustment}
                      </Text>
                    </VStack>

                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => setStockAdjustment(prev => prev + 1)}
                      className="bg-green-50 border-green-300"
                    >
                      <Icon as={PlusIcon} className="w-4 h-4 text-green-600" />
                    </Button>
                  </HStack>

                  <HStack space="md">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onPress={() => {
                        setShowStockAdjustment(false);
                        setStockAdjustment(0);
                      }}
                    >
                      <ButtonText>Cancelar</ButtonText>
                    </Button>

                    <Button
                      className="flex-1 bg-blue-600"
                      onPress={handleStockAdjustment}
                      disabled={stockAdjustment === 0 || updateStockMutation.isPending}
                    >
                      {updateStockMutation.isPending ? (
                        <HStack space="sm" className="items-center">
                          <Spinner size="small" color="white" />
                          <ButtonText className="text-white">Actualizando...</ButtonText>
                        </HStack>
                      ) : (
                        <ButtonText className="text-white font-semibold">
                          Aplicar Ajuste
                        </ButtonText>
                      )}
                    </Button>
                  </HStack>
                </VStack>
              )}

              {isLowStock && !showStockAdjustment && (
                <HStack space="sm" className="items-center bg-orange-50 p-3 rounded-lg">
                  <Icon as={AlertTriangleIcon} className="w-5 h-5 text-orange-600" />
                  <Text className="text-orange-700 text-sm flex-1">
                    El stock está bajo. Considera reponer este producto pronto.
                  </Text>
                </HStack>
              )}
            </VStack>
          </Card>

          {/* Additional Info */}
          <Card className="bg-white border border-gray-200">
            <VStack space="md" className="p-4">
              <Text className="text-lg font-semibold text-gray-900">
                Información Adicional
              </Text>

              <VStack space="sm">
                <HStack className="justify-between">
                  <Text className="text-gray-600">ID del Producto</Text>
                  <Text className="text-gray-900 font-mono text-sm">{product.id}</Text>
                </HStack>

                {product.createdAt && (
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Fecha de Creación</Text>
                    <Text className="text-gray-900">
                      {new Date(product.createdAt).toLocaleDateString('es-PE')}
                    </Text>
                  </HStack>
                )}

                {product.updatedAt && (
                  <HStack className="justify-between">
                    <Text className="text-gray-600">Última Actualización</Text>
                    <Text className="text-gray-900">
                      {new Date(product.updatedAt).toLocaleDateString('es-PE')}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </Card>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}