import React from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CreditCardIcon } from 'lucide-react-native';
import type { PaymentMethod } from '@gymspace/sdk';
import { PaymentMethodItem } from './PaymentMethodItem';
import { getPaymentMethodIcon, getPaymentMethodColor } from '../utils/payment-method-helpers';

interface PaymentMethodsListContainerProps {
  paymentMethods: PaymentMethod[];
  selectedId: string;
  onSelectPaymentMethod: (paymentMethodId: string) => void;
  onViewDetails: (paymentMethod: PaymentMethod) => void;
  isLoading: boolean;
  error: any;
  searchQuery: string;
}

export function PaymentMethodsListContainer({
  paymentMethods,
  selectedId,
  onSelectPaymentMethod,
  onViewDetails,
  isLoading,
  error,
  searchQuery,
}: PaymentMethodsListContainerProps) {
  if (isLoading) {
    return (
      <View className="py-8 items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-2 text-gray-500">Cargando métodos de pago...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="py-8 items-center">
        <Text className="text-red-500">Error al cargar métodos de pago</Text>
      </View>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <View className="py-8 items-center">
        <Icon as={CreditCardIcon} className="text-gray-300 mb-2" size="xl" />
        <Text className="text-gray-500">
          {searchQuery
            ? 'No se encontraron métodos de pago'
            : 'No hay métodos de pago disponibles'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-6">
      <VStack className="py-2 gap-1">
        {paymentMethods.map((paymentMethod) => (
          <PaymentMethodItem
            key={paymentMethod.id}
            paymentMethod={paymentMethod}
            isSelected={selectedId === paymentMethod.id}
            onSelect={() => onSelectPaymentMethod(paymentMethod.id)}
            onViewDetails={() => onViewDetails(paymentMethod)}
            icon={getPaymentMethodIcon(paymentMethod)}
            colorClass={getPaymentMethodColor(paymentMethod.code)}
          />
        ))}
      </VStack>
    </ScrollView>
  );
}