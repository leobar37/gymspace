import React, { useState, useCallback } from 'react';
import { ScrollView, Alert, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { View } from '@/components/ui/view';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import {
  ShoppingCartIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  PackageIcon
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { useCreateSale } from '@/hooks/useSales';
import { useFormatPrice } from '@/config/ConfigContext';
import { ProductCard } from '@/components/inventory/ProductCard';
import { CartItem } from '@/components/inventory/CartItem';
import type { Product, CreateSaleDto, SaleItemDto } from '@gymspace/sdk';

export default function NewSaleScreen() {
  const formatPrice = useFormatPrice();
  const {
    state,
    addItem,
    removeItem,
    updateQuantity,
    setCustomerName,
    setNotes,
    setPaymentStatus,
    resetCart,
    hasItems,
    itemCount,
  } = useCart();

  const [showProductSelection, setShowProductSelection] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  const { data: productsData, isLoading: loadingProducts } = useProducts({ 
    status: 'active',
    inStock: true,
    limit: 50 
  });
  const createSaleMutation = useCreateSale();

  const handleAddProduct = useCallback((product: Product) => {
    if (product.stock && product.stock <= 0) {
      Alert.alert('Sin stock', 'Este producto no tiene stock disponible.');
      return;
    }
    addItem(product, 1);
    setShowProductSelection(false);
  }, [addItem]);

  const handleQuantityChange = useCallback((productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  }, [updateQuantity]);

  const handleRemoveItem = useCallback((productId: string) => {
    Alert.alert(
      'Remover producto',
      '¿Estás seguro de que quieres remover este producto del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => removeItem(productId) },
      ]
    );
  }, [removeItem]);

  const handleCompleteSale = useCallback(async () => {
    if (!hasItems) {
      Alert.alert('Carrito vacío', 'Agrega productos al carrito antes de completar la venta.');
      return;
    }

    setIsProcessingSale(true);

    try {
      const saleItems: SaleItemDto[] = state.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      const saleData: CreateSaleDto = {
        items: saleItems,
        paymentStatus: state.paymentStatus as 'paid' | 'unpaid',
        customerName: state.customerName || undefined,
        notes: state.notes || undefined,
      };

      await createSaleMutation.mutateAsync(saleData);

      Alert.alert(
        'Venta completada',
        `Venta por ${formatPrice(state.total)} completada exitosamente.`,
        [
          {
            text: 'Nueva venta',
            onPress: () => resetCart(),
          },
          {
            text: 'Ver ventas',
            onPress: () => {
              resetCart();
              router.push('/inventory/sales-history');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating sale:', error);
      Alert.alert(
        'Error',
        'No se pudo completar la venta. Por favor intenta nuevamente.'
      );
    } finally {
      setIsProcessingSale(false);
    }
  }, [hasItems, state, createSaleMutation, resetCart]);

  const renderCartItem = useCallback(({ item }: { item: typeof state.items[0] }) => (
    <CartItem
      item={item}
      onQuantityChange={(quantity) => handleQuantityChange(item.product.id, quantity)}
      onRemove={() => handleRemoveItem(item.product.id)}
    />
  ), [handleQuantityChange, handleRemoveItem]);

  const renderProductCard = useCallback(({ item }: { item: Product }) => (
    <View className="w-1/2 p-1">
      <ProductCard
        product={item}
        onPress={handleAddProduct}
        compact={true}
        showStock={true}
      />
    </View>
  ), [handleAddProduct]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="md" className="p-4">
          {/* Header */}
          <HStack className="justify-between items-center">
            <VStack>
              <Text className="text-xl font-bold text-gray-900">
                Nueva Venta
              </Text>
              <Text className="text-gray-600">
                {itemCount} producto{itemCount !== 1 ? 's' : ''} en el carrito
              </Text>
            </VStack>
            
            <Button
              variant="outline"
              size="sm"
              onPress={() => setShowProductSelection(true)}
            >
              <Icon as={PlusIcon} className="w-4 h-4 text-blue-600 mr-2" />
              <ButtonText className="text-blue-600">Agregar</ButtonText>
            </Button>
          </HStack>

          {/* Cart Items */}
          <VStack space="sm">
            <Text className="text-lg font-semibold text-gray-900">
              Productos
            </Text>
            
            {hasItems ? (
              <FlatList
                data={state.items}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.product.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View className="h-2" />}
              />
            ) : (
              <Card className="bg-gray-50 border-gray-200 border-dashed">
                <VStack space="md" className="p-8 items-center">
                  <Icon as={ShoppingCartIcon} className="w-12 h-12 text-gray-400" />
                  <VStack space="xs" className="items-center">
                    <Text className="text-gray-600 font-medium">
                      Carrito vacío
                    </Text>
                    <Text className="text-gray-500 text-center text-sm">
                      Agrega productos para comenzar una nueva venta
                    </Text>
                  </VStack>
                  <Button
                    onPress={() => setShowProductSelection(true)}
                    className="bg-blue-600"
                  >
                    <Icon as={PlusIcon} className="w-4 h-4 text-white mr-2" />
                    <ButtonText className="text-white">Agregar productos</ButtonText>
                  </Button>
                </VStack>
              </Card>
            )}
          </VStack>

          {/* Sale Details */}
          {hasItems && (
            <VStack space="md">
              {/* Customer Name */}
              <VStack space="xs">
                <Text className="text-sm font-medium text-gray-700">
                  Cliente (opcional)
                </Text>
                <Input>
                  <InputField
                    placeholder="Nombre del cliente"
                    value={state.customerName}
                    onChangeText={setCustomerName}
                  />
                </Input>
              </VStack>

              {/* Notes */}
              <VStack space="xs">
                <Text className="text-sm font-medium text-gray-700">
                  Notas (opcional)
                </Text>
                <Input>
                  <InputField
                    placeholder="Notas adicionales"
                    value={state.notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </Input>
              </VStack>

              {/* Payment Status */}
              <VStack space="xs">
                <Text className="text-sm font-medium text-gray-700">
                  Estado de pago
                </Text>
                <HStack space="md" className="items-center">
                  <Switch
                    value={state.paymentStatus === 'paid'}
                    onValueChange={(value) => setPaymentStatus(value ? 'paid' : 'unpaid')}
                  />
                  <Text className="text-gray-600">
                    {state.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente de pago'}
                  </Text>
                </HStack>
              </VStack>

              {/* Total */}
              <Card className="bg-blue-50 border-blue-200">
                <HStack className="justify-between items-center p-4">
                  <Text className="text-lg font-semibold text-blue-900">
                    Total
                  </Text>
                  <Text className="text-2xl font-bold text-blue-900">
                    {formatPrice(state.total)}
                  </Text>
                </HStack>
              </Card>

              {/* Complete Sale Button */}
              <Button
                onPress={handleCompleteSale}
                disabled={isProcessingSale}
                className="bg-green-600 disabled:bg-gray-400"
              >
                {isProcessingSale ? (
                  <HStack space="sm" className="items-center">
                    <Spinner size="small" color="white" />
                    <ButtonText className="text-white">Procesando...</ButtonText>
                  </HStack>
                ) : (
                  <HStack space="sm" className="items-center">
                    <Icon as={CheckIcon} className="w-5 h-5 text-white" />
                    <ButtonText className="text-white font-semibold">
                      Completar Venta
                    </ButtonText>
                  </HStack>
                )}
              </Button>
            </VStack>
          )}
        </VStack>
      </ScrollView>

      {/* Product Selection Modal */}
      <Modal
        visible={showProductSelection}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <VStack className="flex-1">
            {/* Modal Header */}
            <HStack className="justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">
                Seleccionar Producto
              </Text>
              <Pressable
                onPress={() => setShowProductSelection(false)}
                className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
              >
                <Icon as={XIcon} className="w-5 h-5 text-gray-600" />
              </Pressable>
            </HStack>

            {/* Products Grid */}
            <View className="flex-1">
              {loadingProducts ? (
                <View className="flex-1 items-center justify-center">
                  <Spinner size="large" />
                  <Text className="text-gray-600 mt-2">Cargando productos...</Text>
                </View>
              ) : (
                <FlatList
                  data={productsData?.items || []}
                  renderItem={renderProductCard}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  contentContainerStyle={{ padding: 16 }}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={() => (
                    <View className="flex-1 items-center justify-center py-12">
                      <Icon as={PackageIcon} className="w-16 h-16 text-gray-300 mb-4" />
                      <Text className="text-gray-600 text-center">
                        No hay productos disponibles
                      </Text>
                    </View>
                  )}
                />
              )}
            </View>
          </VStack>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}