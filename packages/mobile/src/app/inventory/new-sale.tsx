import React, { useState, useCallback, useEffect } from 'react';
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
import {
  ShoppingCartIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  PackageIcon,
  ChevronLeftIcon,
  WrenchIcon,
  CreditCardIcon,
  ClockIcon
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { useCreateSale } from '@/hooks/useSales';
import { useFormatPrice } from '@/config/ConfigContext';
import { ProductCard } from '@/components/inventory/ProductCard';
import { ServiceCard } from '@/components/inventory/services';
import { CartItem } from '@/components/inventory/CartItem';
import { ClientSelector } from '@/features/clients/components/ClientSelector';
import { useForm, FormProvider } from 'react-hook-form';
import { useLoadingScreen } from '@/shared/loading-screen';
import { PRODUCT_TYPES } from '@/shared/constants';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { FileSelector } from '@/features/files/components/FileSelector';
import type { Product, CreateSaleDto, SaleItemDto, Client } from '@gymspace/sdk';

// Componente para el header con botón de retroceso
interface SaleHeaderProps {
  onBack: () => void;
}

function SaleHeader({ onBack }: SaleHeaderProps) {
  return (
    <HStack className="items-center mb-2">
      <Pressable
        onPress={onBack}
        className="p-2 -ml-2 rounded-lg"
      >
        <Icon as={ChevronLeftIcon} className="w-6 h-6 text-gray-700" />
      </Pressable>
      <Text className="text-xl font-bold text-gray-900 ml-2">
        Nueva Venta
      </Text>
    </HStack>
  );
}

// Componente para el resumen del carrito
interface CartSummaryProps {
  itemCount: number;
  onAddItems: () => void;
}

function CartSummary({ itemCount, onAddItems }: CartSummaryProps) {
  return (
    <HStack className="justify-between items-center">
      <Text className="text-gray-600">
        {itemCount} item{itemCount !== 1 ? 's' : ''} en el carrito
      </Text>
      
      <Button
        variant="outline"
        size="sm"
        onPress={onAddItems}
      >
        <Icon as={PlusIcon} className="w-4 h-4 mr-2 text-black" />
        <ButtonText>Agregar</ButtonText>
      </Button>
    </HStack>
  );
}

// Componente para el carrito vacío
interface EmptyCartProps {
  onAddItems: () => void;
}

function EmptyCart({ onAddItems }: EmptyCartProps) {
  return (
    <Card className="bg-gray-50 border-gray-200 border-dashed">
      <VStack space="md" className="p-8 items-center">
        <Icon as={ShoppingCartIcon} className="w-12 h-12 text-gray-400" />
        <VStack space="xs" className="items-center">
          <Text className="text-gray-600 font-medium">
            Carrito vacío
          </Text>
          <Text className="text-gray-500 text-center text-sm">
            Agrega items para comenzar una nueva venta
          </Text>
        </VStack>
        <Button
          onPress={onAddItems}
          variant="solid"
        >
          <Icon as={PlusIcon} className="w-4 h-4 mr-2" />
          <ButtonText>Agregar items</ButtonText>
        </Button>
      </VStack>
    </Card>
  );
}

// Componente para las pestañas de productos/servicios
interface ItemTabsProps {
  selectedTab: 'products' | 'services';
  onTabChange: (tab: 'products' | 'services') => void;
}

function ItemTabs({ selectedTab, onTabChange }: ItemTabsProps) {
  return (
    <HStack className="p-2 bg-gray-100">
      <Pressable
        onPress={() => onTabChange('products')}
        className={`flex-1 py-2 px-4 rounded-lg ${
          selectedTab === 'products' ? 'bg-white shadow-sm' : ''
        }`}
      >
        <HStack className="items-center justify-center" space="sm">
          <Icon 
            as={PackageIcon} 
            className={`w-4 h-4 ${
              selectedTab === 'products' ? 'text-blue-600' : 'text-gray-500'
            }`} 
          />
          <Text 
            className={`font-medium ${
              selectedTab === 'products' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            Productos
          </Text>
        </HStack>
      </Pressable>

      <Pressable
        onPress={() => onTabChange('services')}
        className={`flex-1 py-2 px-4 rounded-lg ${
          selectedTab === 'services' ? 'bg-white shadow-sm' : ''
        }`}
      >
        <HStack className="items-center justify-center" space="sm">
          <Icon 
            as={WrenchIcon} 
            className={`w-4 h-4 ${
              selectedTab === 'services' ? 'text-blue-600' : 'text-gray-500'
            }`} 
          />
          <Text 
            className={`font-medium ${
              selectedTab === 'services' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            Servicios
          </Text>
        </HStack>
      </Pressable>
    </HStack>
  );
}

// Componente para el modal de selección de items
interface ItemSelectionModalProps {
  visible: boolean;
  selectedTab: 'products' | 'services';
  onClose: () => void;
  onTabChange: (tab: 'products' | 'services') => void;
  onAddItem: (item: Product) => void;
  productsData?: { items: Product[] };
  servicesData?: { items: Product[] };
  loadingProducts: boolean;
  loadingServices: boolean;
}

function ItemSelectionModal({
  visible,
  selectedTab,
  onClose,
  onTabChange,
  onAddItem,
  productsData,
  servicesData,
  loadingProducts,
  loadingServices
}: ItemSelectionModalProps) {
  const renderProductCard = useCallback(({ item }: { item: Product }) => (
    <View className="w-1/2 p-1">
      <ProductCard
        product={item}
        onPress={onAddItem}
        compact={true}
        showStock={true}
      />
    </View>
  ), [onAddItem]);

  const renderServiceCard = useCallback(({ item }: { item: Product }) => (
    <View className="w-1/2 p-1">
      <ServiceCard
        service={item}
        onPress={onAddItem}
        compact={true}
      />
    </View>
  ), [onAddItem]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-white">
        <VStack className="flex-1">
          {/* Modal Header */}
          <HStack className="justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">
              Seleccionar {selectedTab === 'products' ? 'Producto' : 'Servicio'}
            </Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
            >
              <Icon as={XIcon} className="w-5 h-5 text-gray-600" />
            </Pressable>
          </HStack>

          {/* Tabs */}
          <ItemTabs selectedTab={selectedTab} onTabChange={onTabChange} />

          {/* Content */}
          <View className="flex-1">
            {selectedTab === 'products' ? (
              loadingProducts ? (
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
              )
            ) : (
              loadingServices ? (
                <View className="flex-1 items-center justify-center">
                  <Spinner size="large" />
                  <Text className="text-gray-600 mt-2">Cargando servicios...</Text>
                </View>
              ) : (
                <FlatList
                  data={servicesData?.items || []}
                  renderItem={renderServiceCard}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  contentContainerStyle={{ padding: 16 }}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={() => (
                    <View className="flex-1 items-center justify-center py-12">
                      <Icon as={WrenchIcon} className="w-16 h-16 text-gray-300 mb-4" />
                      <Text className="text-gray-600 text-center">
                        No hay servicios disponibles
                      </Text>
                    </View>
                  )}
                />
              )
            )}
          </View>
        </VStack>
      </SafeAreaView>
    </Modal>
  );
}

interface SaleFormData {
  clientId?: string;
  notes?: string;
  fileIds?: string[];
}

export default function NewSaleScreen() {
  const formatPrice = useFormatPrice();
  const { execute } = useLoadingScreen();
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedTab, setSelectedTab] = useState<'products' | 'services'>('products');

  const methods = useForm<SaleFormData>({
    defaultValues: {
      clientId: '',
      notes: '',
      fileIds: [],
    },
  });

  const { data: productsData, isLoading: loadingProducts } = useProducts({ 
    status: 'active',
    type: PRODUCT_TYPES.PRODUCT,
    inStock: true,
    page: 1,
    limit: 50 
  });
  
  const { data: servicesData, isLoading: loadingServices } = useProducts({ 
    status: 'active',
    type: PRODUCT_TYPES.SERVICE,
    page: 1,
    limit: 50 
  });
  
  const createSaleMutation = useCreateSale();

  // Update customer name when client is selected
  useEffect(() => {
    if (selectedClient) {
      setCustomerName(selectedClient.name);
    } else {
      setCustomerName('');
    }
  }, [selectedClient]); // setCustomerName should be stable, no need in deps

  const handleClientSelect = useCallback((client: Client | null) => {
    setSelectedClient(client);
  }, []);

  const handleAddItem = useCallback((product: Product) => {
    // Only check stock for products, not services
    if (product.type === PRODUCT_TYPES.PRODUCT && product.stock !== null && product.stock <= 0) {
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
      'Remover item',
      '¿Estás seguro de que quieres remover este item del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => removeItem(productId) },
      ]
    );
  }, [removeItem]);

  const handleCompleteSale = useCallback(async () => {
    if (!hasItems) {
      Alert.alert('Carrito vacío', 'Agrega items al carrito antes de completar la venta.');
      return;
    }

    const formData = methods.getValues();
    const saleItems: SaleItemDto[] = state.items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    const saleData: CreateSaleDto = {
      items: saleItems,
      customerId: selectedClient?.id,
      paymentStatus: state.paymentStatus as 'paid' | 'unpaid',
      customerName: state.customerName || undefined,
      notes: state.notes || undefined,
      fileIds: formData.fileIds?.filter(id => id) || [],
    };

    await execute(
      createSaleMutation.mutateAsync(saleData),
      {
        action: 'Procesando venta...',
        successMessage: `Venta por ${formatPrice(state.total)} completada exitosamente`,
        successActions: [
          {
            label: 'Nueva venta',
            onPress: () => {
              resetCart();
            },
            variant: 'solid',
          },
          {
            label: 'Volver al inicio',
            onPress: () => {
              resetCart();
              router.push('/(app)');
            },
            variant: 'outline',
          },
        ],
        errorFormatter: (error) => {
          if (error instanceof Error) {
            return `Error al procesar la venta: ${error.message}`;
          }
          return 'No se pudo completar la venta. Por favor intenta nuevamente.';
        },
        errorActions: [
          {
            label: 'Reintentar',
            onPress: () => {
              // El usuario puede reintentar desde la misma pantalla
            },
            variant: 'solid',
          },
          {
            label: 'Cancelar',
            onPress: () => {
              // No action needed, just close the modal
            },
            variant: 'outline',
          },
        ],
        hideOnSuccess: false,
      }
    );
  }, [hasItems, state, createSaleMutation, resetCart, execute, formatPrice, methods, selectedClient]);

  const renderCartItem = useCallback(({ item }: { item: typeof state.items[0] }) => (
    <CartItem
      item={item}
      onQuantityChange={(quantity) => handleQuantityChange(item.product.id, quantity)}
      onRemove={() => handleRemoveItem(item.product.id)}
    />
  ), [handleQuantityChange, handleRemoveItem]);

  return (
    <FormProvider {...methods}>
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScreenForm
          useSafeArea={false}
          showBackButton={false}
          showFixedFooter={hasItems}
          footerContent={hasItems && (
            <VStack space="sm">
              {/* Total Display */}
              <HStack className="justify-between items-center p-4 bg-gray-50 rounded-lg">
                <Text className="text-lg font-medium text-gray-700">Total</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {formatPrice(state.total)}
                </Text>
              </HStack>
              
              {/* Complete Sale Button */}
              <Button
                onPress={handleCompleteSale}
                variant="solid"
                size="lg"
                className="w-full"
              >
                <HStack space="sm" className="items-center">
                  <Icon as={CheckIcon} className="w-5 h-5" />
                  <ButtonText className="font-semibold">
                    Completar Venta
                  </ButtonText>
                </HStack>
              </Button>
            </VStack>
          )}
        >
          <VStack space="md">
            {/* Header */}
            <SaleHeader onBack={() => router.back()} />

            {/* Cart Summary */}
            <CartSummary 
              itemCount={itemCount} 
              onAddItems={() => setShowProductSelection(true)} 
            />

            {/* Cart Items */}
            <VStack space="sm">
              <Text className="text-lg font-semibold text-gray-900">
                Items
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
                <EmptyCart onAddItems={() => setShowProductSelection(true)} />
              )}
            </VStack>

            {/* Sale Details Form */}
            {hasItems && (
              <VStack space="md">
                {/* Client Selector */}
                <ClientSelector
                  name="clientId"
                  control={methods.control}
                  label="Cliente (opcional)"
                  placeholder="Seleccionar cliente"
                  allowClear={true}
                  onClientSelect={handleClientSelect}
                />

                {/* Notes Input */}
                <VStack space="xs">
                  <Text className="text-sm font-medium text-gray-700">Notas (opcional)</Text>
                  <Input>
                    <InputField
                      placeholder="Agregar notas sobre la venta..."
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
                  <Text className="text-sm font-medium text-gray-700">Estado de pago</Text>
                  <HStack space="md">
                    <Pressable
                      onPress={() => setPaymentStatus('paid')}
                      className={`flex-1 p-3 rounded-lg border ${
                        state.paymentStatus === 'paid' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <HStack space="sm" className="items-center justify-center">
                        <Icon 
                          as={CreditCardIcon} 
                          className={`w-4 h-4 ${
                            state.paymentStatus === 'paid' ? 'text-green-600' : 'text-gray-500'
                          }`} 
                        />
                        <Text className={`font-medium ${
                          state.paymentStatus === 'paid' ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          Pagado
                        </Text>
                      </HStack>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => setPaymentStatus('unpaid')}
                      className={`flex-1 p-3 rounded-lg border ${
                        state.paymentStatus === 'unpaid' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <HStack space="sm" className="items-center justify-center">
                        <Icon 
                          as={ClockIcon} 
                          className={`w-4 h-4 ${
                            state.paymentStatus === 'unpaid' ? 'text-orange-600' : 'text-gray-500'
                          }`} 
                        />
                        <Text className={`font-medium ${
                          state.paymentStatus === 'unpaid' ? 'text-orange-700' : 'text-gray-600'
                        }`}>
                          Pendiente
                        </Text>
                      </HStack>
                    </Pressable>
                  </HStack>
                </VStack>

                {/* File Attachments */}
                <FileSelector
                  name="fileIds"
                  multi={true}
                  label="Archivos adjuntos (opcional)"
                />
              </VStack>
            )}
          </VStack>
        </ScreenForm>

        {/* Item Selection Modal */}
        <ItemSelectionModal
          visible={showProductSelection}
          selectedTab={selectedTab}
          onClose={() => setShowProductSelection(false)}
          onTabChange={setSelectedTab}
          onAddItem={handleAddItem}
          productsData={productsData}
          servicesData={servicesData}
          loadingProducts={loadingProducts}
          loadingServices={loadingServices}
        />
      </SafeAreaView>
    </FormProvider>
  );
}