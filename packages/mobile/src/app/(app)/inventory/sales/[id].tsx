import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { View } from '@/components/ui/view';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Alert as UIAlert, AlertIcon, AlertText } from '@/components/ui/alert';
import {
  CalendarIcon,
  UserIcon,
  FileTextIcon,
  CreditCardIcon,
  ClockIcon,
  EditIcon,
  CopyIcon,
  InfoIcon,
  ArrowLeftIcon,
  ShoppingCartIcon
} from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSale, useUpdatePaymentStatus } from '@/hooks/useSales';
import { useFormatPrice } from '@/config/ConfigContext';
// PaymentStatus is just 'paid' | 'unpaid' as defined in the Sale model

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const formatPrice = useFormatPrice();
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const { data: sale, isLoading, isError, error, refetch } = useSale(id!);
  const updatePaymentMutation = useUpdatePaymentStatus();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };


  const handleUpdatePaymentStatus = async (newStatus: 'paid' | 'unpaid') => {
    if (!sale) return;

    const statusText = newStatus === 'paid' ? 'pagado' : 'pendiente';
    
    Alert.alert(
      'Cambiar estado de pago',
      `¿Confirmas que quieres marcar esta venta como ${statusText}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsUpdatingPayment(true);
            try {
              await updatePaymentMutation.mutateAsync({
                id: sale.id,
                paymentStatus: newStatus,
              });
              
              Alert.alert('Éxito', `Venta marcada como ${statusText}`);
            } catch (error) {
              console.error('Error updating payment status:', error);
              Alert.alert(
                'Error',
                'No se pudo actualizar el estado de pago. Por favor intenta nuevamente.'
              );
            } finally {
              setIsUpdatingPayment(false);
            }
          },
        },
      ]
    );
  };

  const handleDuplicateSale = () => {
    if (!sale) return;
    
    Alert.alert(
      'Duplicar venta',
      'Esta función creará una nueva venta con los mismos productos',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Duplicar',
          onPress: () => {
            // TODO: Implement sale duplication
            router.push('/(app)/inventory/new-sale');
          },
        },
      ]
    );
  };

  const handleEditSale = () => {
    Alert.alert(
      'Editar venta',
      'La función de edición estará disponible próximamente',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Spinner size="large" />
          <Text className="text-gray-600 mt-4">Cargando venta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !sale) {
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
                Error al cargar la venta: {error?.message || 'Venta no encontrada'}
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

  const isPaid = sale.paymentStatus === 'paid';
  const totalQuantity = sale.saleItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

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
                onPress={handleEditSale}
              >
                <Icon as={EditIcon} className="w-4 h-4 text-gray-600 mr-1" />
                <ButtonText className="text-gray-600">Editar</ButtonText>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onPress={handleDuplicateSale}
              >
                <Icon as={CopyIcon} className="w-4 h-4 text-gray-600 mr-1" />
                <ButtonText className="text-gray-600">Duplicar</ButtonText>
              </Button>
            </HStack>
          </HStack>

          {/* Sale Info Card */}
          <Card className="bg-white border border-gray-200">
            <VStack space="md" className="p-4">
              {/* Date and Time */}
              <HStack className="justify-between items-center">
                <HStack space="sm" className="items-center">
                  <Icon as={CalendarIcon} className="w-5 h-5 text-gray-500" />
                  <VStack>
                    <Text className="text-lg font-semibold text-gray-900">
                      {formatDate(sale.saleDate)}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {formatTime(sale.saleDate)}
                    </Text>
                  </VStack>
                </HStack>
                
                <Badge 
                  variant={isPaid ? "solid" : "outline"}
                  className={isPaid ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}
                >
                  <Icon 
                    as={isPaid ? CreditCardIcon : ClockIcon}
                    className={`w-4 h-4 mr-1 ${isPaid ? 'text-green-600' : 'text-red-600'}`}
                  />
                  <BadgeText className={isPaid ? 'text-green-700' : 'text-red-700'}>
                    {isPaid ? 'Pagado' : 'Pendiente'}
                  </BadgeText>
                </Badge>
              </HStack>

              {/* Customer */}
              {sale.customerName && (
                <HStack space="sm" className="items-center">
                  <Icon as={UserIcon} className="w-5 h-5 text-gray-500" />
                  <Text className="text-base text-gray-900">
                    {sale.customerName}
                  </Text>
                </HStack>
              )}

              {/* Notes */}
              {sale.notes && (
                <VStack space="xs">
                  <HStack space="sm" className="items-center">
                    <Icon as={FileTextIcon} className="w-5 h-5 text-gray-500" />
                    <Text className="text-sm font-medium text-gray-700">
                      Notas:
                    </Text>
                  </HStack>
                  <Text className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {sale.notes}
                  </Text>
                </VStack>
              )}
            </VStack>
          </Card>

          {/* Payment Status Control */}
          <Card className="bg-white border border-gray-200">
            <VStack space="md" className="p-4">
              <Text className="text-lg font-semibold text-gray-900">
                Estado de Pago
              </Text>
              
              <HStack className="justify-between items-center">
                <Text className="text-base text-gray-700">
                  {isPaid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                </Text>
                
                <Switch
                  value={isPaid}
                  onValueChange={(value) => 
                    handleUpdatePaymentStatus(value ? 'paid' : 'unpaid')
                  }
                  disabled={isUpdatingPayment}
                />
              </HStack>
              
              {isUpdatingPayment && (
                <HStack space="sm" className="items-center">
                  <Spinner size="small" />
                  <Text className="text-sm text-gray-600">
                    Actualizando estado de pago...
                  </Text>
                </HStack>
              )}
            </VStack>
          </Card>

          {/* Products Sold */}
          <Card className="bg-white border border-gray-200">
            <VStack space="md" className="p-4">
              <HStack className="justify-between items-center">
                <Text className="text-lg font-semibold text-gray-900">
                  Productos Vendidos
                </Text>
                <Text className="text-sm text-gray-600">
                  {sale.saleItems?.length || 0} productos ({totalQuantity} unidades)
                </Text>
              </HStack>
              
              {sale.saleItems && sale.saleItems.length > 0 ? (
                <VStack space="sm">
                  {sale.saleItems.map((item: any, index: number) => (
                    <Card key={index} className="bg-gray-50 border-gray-200">
                      <HStack className="justify-between items-center p-3">
                        <VStack className="flex-1">
                          <Text className="text-base font-medium text-gray-900">
                            {item.product?.name || 'Producto'}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            {formatPrice(item.unitPrice)} × {item.quantity}
                          </Text>
                        </VStack>
                        
                        <Text className="text-base font-semibold text-gray-900">
                          {formatPrice(item.total)}
                        </Text>
                      </HStack>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <HStack space="sm" className="items-center justify-center py-4">
                  <Icon as={ShoppingCartIcon} className="w-6 h-6 text-gray-400" />
                  <Text className="text-gray-600">
                    No se encontraron productos
                  </Text>
                </HStack>
              )}
            </VStack>
          </Card>

          {/* Total */}
          <Card className="bg-blue-50 border-blue-200">
            <HStack className="justify-between items-center p-4">
              <Text className="text-xl font-semibold text-blue-900">
                Total de la Venta
              </Text>
              <Text className="text-3xl font-bold text-blue-900">
                {formatPrice(sale.total)}
              </Text>
            </HStack>
          </Card>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}