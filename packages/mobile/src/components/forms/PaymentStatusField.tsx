import React from 'react';
import { useController, UseControllerProps } from 'react-hook-form';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { CreditCardIcon, ClockIcon } from 'lucide-react-native';

type PaymentStatus = 'paid' | 'unpaid';

interface PaymentStatusFieldProps<TFieldValues extends Record<string, any> = Record<string, any>>
  extends UseControllerProps<TFieldValues> {
  label?: string;
  description?: string;
}

export function PaymentStatusField<TFieldValues extends Record<string, any> = Record<string, any>>({
  name,
  control,
  rules,
  defaultValue,
  label = 'Estado de pago',
  description,
}: PaymentStatusFieldProps<TFieldValues>) {
  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    rules,
    defaultValue: defaultValue || 'paid',
  });

  const handleStatusChange = (status: PaymentStatus) => {
    onChange(status);
  };

  return (
    <VStack space="xs">
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}
      {description && (
        <Text className="text-xs text-gray-500">{description}</Text>
      )}
      
      <HStack space="md">
        <Pressable
          onPress={() => handleStatusChange('paid')}
          className={`flex-1 p-3 rounded-lg border ${
            value === 'paid'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-white'
          }`}
        >
          <HStack space="sm" className="items-center justify-center">
            <Icon
              as={CreditCardIcon}
              className={`w-4 h-4 ${
                value === 'paid' ? 'text-green-600' : 'text-gray-500'
              }`}
            />
            <Text
              className={`font-medium ${
                value === 'paid' ? 'text-green-700' : 'text-gray-600'
              }`}
            >
              Pagado
            </Text>
          </HStack>
        </Pressable>

        <Pressable
          onPress={() => handleStatusChange('unpaid')}
          className={`flex-1 p-3 rounded-lg border ${
            value === 'unpaid'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 bg-white'
          }`}
        >
          <HStack space="sm" className="items-center justify-center">
            <Icon
              as={ClockIcon}
              className={`w-4 h-4 ${
                value === 'unpaid' ? 'text-orange-600' : 'text-gray-500'
              }`}
            />
            <Text
              className={`font-medium ${
                value === 'unpaid' ? 'text-orange-700' : 'text-gray-600'
              }`}
            >
              Pendiente
            </Text>
          </HStack>
        </Pressable>
      </HStack>
    </VStack>
  );
}