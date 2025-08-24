import React from 'react';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import {
  CalendarIcon,
  UserIcon,
  FileTextIcon,
  CreditCardIcon,
  ClockIcon,
} from 'lucide-react-native';
import type { Sale } from '@gymspace/sdk';

interface SaleInfoCardProps {
  sale: Sale;
}

export function SaleInfoCard({ sale }: SaleInfoCardProps) {
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

  const isPaid = sale.paymentStatus === 'paid';

  return (
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
  );
}