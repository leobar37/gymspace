import React from 'react';
import { Pressable } from 'react-native';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import {
  CalendarIcon,
  UserIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  ClockIcon,
} from 'lucide-react-native';
import { useFormatPrice } from '@/config/ConfigContext';
import type { Sale } from '@gymspace/sdk';

interface SaleHistoryItemProps {
  sale: Sale;
  onPress?: (sale: Sale) => void;
  showCustomer?: boolean;
}

export function SaleHistoryItem({ sale, onPress, showCustomer = true }: SaleHistoryItemProps) {
  const formatPrice = useFormatPrice();

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

  const handlePress = () => {
    onPress?.(sale);
  };

  const isPaid = sale.paymentStatus === 'paid';
  const itemCount = sale._count?.saleItems || sale.saleItems?.length || 0;

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <Pressable onPress={handlePress} className="p-4 active:bg-gray-50">
        <VStack space="sm">
          {/* Header Row - Date, Time, and Payment Status */}
          <HStack className="justify-between items-start">
            <HStack space="md" className="flex-1 items-center">
              <Icon as={CalendarIcon} className="w-4 h-4 text-gray-500" />
              <VStack>
                <Text className="text-sm font-medium text-gray-900">
                  {formatDate(sale.saleDate)}
                </Text>
                <Text className="text-xs text-gray-500">{formatTime(sale.saleDate)}</Text>
              </VStack>
            </HStack>

            <Badge
              variant={isPaid ? 'solid' : 'outline'}
              className={isPaid ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}
            >
              <Icon
                as={isPaid ? CreditCardIcon : ClockIcon}
                className={`w-3 h-3 mr-1 ${isPaid ? 'text-green-600' : 'text-red-600'}`}
              />
              <BadgeText className={isPaid ? 'text-green-700' : 'text-red-700'}>
                {isPaid ? 'Pagado' : 'Pendiente'}
              </BadgeText>
            </Badge>
          </HStack>

          {/* Customer Info */}
          {showCustomer && (sale.customer?.name || sale.customerName) && (
            <HStack space="sm" className="items-center">
              <Icon as={UserIcon} className="w-4 h-4 text-gray-500" />
              <Text className="text-sm text-gray-700">
                {sale.customer?.name || sale.customerName}
                {sale.customer?.clientNumber && (
                  <Text className="text-xs text-gray-500 ml-2">#{sale.customer.clientNumber}</Text>
                )}
              </Text>
            </HStack>
          )}

          {/* Sale Summary */}
          <HStack className="justify-between items-center">
            <HStack space="sm" className="items-center">
              <Icon as={ShoppingCartIcon} className="w-4 h-4 text-gray-500" />
              <Text className="text-sm text-gray-600">
                {itemCount} items {itemCount !== 1 ? 's' : ''}
              </Text>
            </HStack>

            <Text className="text-lg font-bold text-gray-900">{formatPrice(sale.total)}</Text>
          </HStack>

          {/* Notes */}
          {sale.notes && (
            <Text className="text-sm text-gray-600 bg-gray-50 p-2 rounded" numberOfLines={2}>
              "{sale.notes}"
            </Text>
          )}
          {/* Quick Item Preview */}
          {/* {sale.items && sale.items.length > 0 && (
            <VStack space="xs">
              <Text className="text-xs font-medium text-gray-500 uppercase">
                Productos vendidos:
              </Text>
              <Text className="text-sm text-gray-600" numberOfLines={2}>
                {sale.items.map(item => 
                  `${item.product?.name || 'Producto'} (${item.quantity}x)`
                ).join(', ')}
              </Text>
            </VStack>
          )} */}
        </VStack>
      </Pressable>
    </Card>
  );
}
