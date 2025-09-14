import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert as UIAlert, AlertIcon, AlertText } from '@/components/ui/alert';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Pressable } from '@/components/ui/pressable';
import { 
  InfoIcon, 
  CalendarIcon, 
  ClockIcon,
  UserIcon,
  UserPlusIcon,
  CreditCardIcon,
  FileTextIcon,
  PackageIcon,
  RefreshCwIcon
} from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSale, useUpdateSale } from '@/features/inventory/hooks/useSales';
import { useFormatPrice } from '@/config/ConfigContext';
import { useLoadingScreen } from '@/shared/loading-screen';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { SheetManager } from 'react-native-actions-sheet';
import type { Sale, Client } from '@gymspace/sdk';

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

// Helper function to format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

// Date and Time Section
const DateTimeSection: React.FC<{ sale: Sale }> = ({ sale }) => {
  return (
    <View className="py-4">
      <HStack className="items-center gap-2">
        <Icon as={CalendarIcon} className="text-gray-400" size="sm" />
        <Text className="text-base font-semibold text-gray-900">
          {formatDate(sale.saleDate)}
        </Text>
      </HStack>
      <HStack className="items-center gap-2 mt-1">
        <Icon as={ClockIcon} className="text-gray-400" size="sm" />
        <Text className="text-sm text-gray-600">
          {formatTime(sale.saleDate)}
        </Text>
      </HStack>
    </View>
  );
};

// Payment Status Section
const PaymentStatusSection: React.FC<{ sale: Sale }> = ({ sale }) => {
  const isPaid = sale.paymentStatus === 'paid';
  
  return (
    <View className="py-4">
      <Text className="text-sm font-medium text-gray-500 mb-2">
        Estado de Pago
      </Text>
      <HStack className="items-center justify-between">
        <HStack className="items-center gap-2">
          <Icon 
            as={isPaid ? CreditCardIcon : ClockIcon} 
            className={isPaid ? 'text-green-600' : 'text-orange-500'} 
            size="sm" 
          />
          <Text className={`font-medium ${isPaid ? 'text-green-700' : 'text-orange-600'}`}>
            {isPaid ? 'Pagado' : 'Pendiente'}
          </Text>
        </HStack>
        {sale.paymentMethod && (
          <Text className="text-sm text-gray-600">
            {sale.paymentMethod === 'cash' ? 'Efectivo' : 
             sale.paymentMethod === 'card' ? 'Tarjeta' : 
             sale.paymentMethod === 'transfer' ? 'Transferencia' : 
             sale.paymentMethod}
          </Text>
        )}
      </HStack>
    </View>
  );
};

// Customer Section
const CustomerSection: React.FC<{ 
  sale: Sale; 
  onAffiliateClient: () => void;
  isUpdating: boolean;
}> = ({ sale, onAffiliateClient, isUpdating }) => {
  if (sale.customerId && sale.customerName) {
    return (
      <View className="py-4">
        <Text className="text-sm font-medium text-gray-500 mb-2">
          Cliente
        </Text>
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-3">
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
              <Icon as={UserIcon} className="text-gray-600" size="sm" />
            </View>
            <Text className="text-base font-medium text-gray-900">
              {sale.customerName}
            </Text>
          </HStack>
        </HStack>
      </View>
    );
  }

  return (
    <View className="py-4">
      <Text className="text-sm font-medium text-gray-500 mb-3">
        Cliente
      </Text>
      <Pressable
        onPress={onAffiliateClient}
        disabled={isUpdating}
        className="bg-blue-50 rounded-lg p-4 border border-blue-200"
      >
        <HStack className="items-center justify-center gap-2">
          <Icon as={UserPlusIcon} className="text-blue-600" size="sm" />
          <Text className="text-blue-600 font-medium">
            Afiliar cliente a esta venta
          </Text>
        </HStack>
      </Pressable>
    </View>
  );
};

// Products Section
const ProductsSection: React.FC<{ sale: Sale; formatPrice: (price: number) => string }> = ({ sale, formatPrice }) => {
  if (!sale.items || sale.items.length === 0) {
    return null;
  }

  return (
    <View className="py-4">
      <HStack className="items-center justify-between mb-3">
        <Text className="text-sm font-medium text-gray-500">
          Productos Vendidos
        </Text>
        <Badge variant="outline" className="border-gray-300">
          <BadgeText className="text-gray-600">
            {sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'}
          </BadgeText>
        </Badge>
      </HStack>
      
      <VStack className="gap-3">
        {sale.items.map((item, index) => (
          <View key={index} className="bg-gray-50 rounded-lg p-3">
            <HStack className="justify-between items-start">
              <VStack className="flex-1 gap-1">
                <Text className="font-medium text-gray-900">
                  {item.productName}
                </Text>
                <HStack className="gap-3">
                  <Text className="text-sm text-gray-600">
                    Cantidad: {item.quantity}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {formatPrice(item.price)} c/u
                  </Text>
                </HStack>
              </VStack>
              <Text className="font-semibold text-gray-900">
                {formatPrice(item.subtotal)}
              </Text>
            </HStack>
          </View>
        ))}
      </VStack>
    </View>
  );
};

// Notes Section
const NotesSection: React.FC<{ sale: Sale }> = ({ sale }) => {
  if (!sale.notes) {
    return null;
  }

  return (
    <View className="py-4">
      <HStack className="items-center gap-2 mb-2">
        <Icon as={FileTextIcon} className="text-gray-400" size="sm" />
        <Text className="text-sm font-medium text-gray-500">
          Notas
        </Text>
      </HStack>
      <View className="bg-gray-50 rounded-lg p-3">
        <Text className="text-sm text-gray-700">
          {sale.notes}
        </Text>
      </View>
    </View>
  );
};

// Main Component
export default function SaleDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id as string;
  const formatPrice = useFormatPrice();
  const { execute } = useLoadingScreen();

  const { data: sale, isLoading, isError, error, refetch } = useSale(id);
  const { mutate: updateSale, isPending: isUpdating } = useUpdateSale();

  const handleAffiliateClient = () => {
    if (!sale) return;

    SheetManager.show('client-selector', {
      mode: 'affiliate',
      currentClientId: sale.customerId,
      onSelect: async (client: Client) => {
        await execute({
          action: 'Afiliando cliente...',
          fn: async () => {
            updateSale(
              {
                id: sale.id,
                data: { customerId: client.id }
              },
              {
                onSuccess: () => {
                  refetch();
                },
              }
            );
          },
          successMessage: 'Cliente afiliado correctamente',
        });
      },
    });
  };

  if (!id) {
    return (
      <ScreenForm title="Detalle de Venta">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">ID de venta no válido</Text>
        </View>
      </ScreenForm>
    );
  }

  if (isLoading) {
    return (
      <ScreenForm title="Detalle de Venta">
        <View className="flex-1 items-center justify-center">
          <Spinner size="large" />
          <Text className="text-gray-600 mt-4">Cargando venta...</Text>
        </View>
      </ScreenForm>
    );
  }

  if (isError || !sale) {
    return (
      <ScreenForm title="Detalle de Venta">
        <View className="flex-1 items-center justify-center px-4">
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
            <Icon as={RefreshCwIcon} className="mr-2" size="sm" />
            <ButtonText>Reintentar</ButtonText>
          </Button>
        </View>
      </ScreenForm>
    );
  }

  return (
    <ScreenForm 
      title="Detalle de Venta"
      showFixedFooter={true}
      footerContent={
        <View className="bg-blue-50 rounded-lg p-4">
          <HStack className="justify-between items-center">
            <Text className="text-lg font-medium text-blue-900">Total de la Venta</Text>
            <Text className="text-2xl font-bold text-blue-900">{formatPrice(sale.total)}</Text>
          </HStack>
        </View>
      }
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Date and Time */}
        <DateTimeSection sale={sale} />
        
        {/* Divider */}
        <View className="h-px bg-gray-100" />
        
        {/* Payment Status */}
        <PaymentStatusSection sale={sale} />
        
        {/* Divider */}
        <View className="h-px bg-gray-100" />
        
        {/* Customer */}
        <CustomerSection 
          sale={sale} 
          onAffiliateClient={handleAffiliateClient}
          isUpdating={isUpdating}
        />
        
        {/* Divider */}
        <View className="h-px bg-gray-100" />
        
        {/* Products */}
        <ProductsSection sale={sale} formatPrice={formatPrice} />
        
        {/* Notes - Only show if exists */}
        {sale.notes && (
          <>
            <View className="h-px bg-gray-100" />
            <NotesSection sale={sale} />
          </>
        )}
        
        {/* Bottom padding for scroll */}
        <View className="h-8" />
      </ScrollView>
    </ScreenForm>
  );
}