import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { ChevronDownIcon, XIcon } from 'lucide-react-native';
import { SheetManager } from '@gymspace/sheet';
import { usePaymentMethodsController } from '../controllers/payment-methods.controller';
import type { PaymentMethod } from '@gymspace/sdk';

interface PaymentMethodSelectorFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends UseControllerProps<TFieldValues> {
  label?: string;
  description?: string;
  placeholder?: string;
  enabled?: boolean;
  allowClear?: boolean;
  enabledOnly?: boolean;
  onPaymentMethodSelect?: (paymentMethod: PaymentMethod | null) => void;
}

export function PaymentMethodSelectorField<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label = 'Método de Pago',
  description,
  placeholder = 'Seleccionar método de pago',
  enabled = true,
  allowClear = false,
  enabledOnly = true,
  onPaymentMethodSelect,
}: PaymentMethodSelectorFieldProps<TFieldValues>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const { usePaymentMethodDetail } = usePaymentMethodsController();

  // Only fetch selected payment method details when field.value exists and is not empty
  const { data: paymentMethodDetailData } = usePaymentMethodDetail(
    field.value && typeof field.value === 'string' && field.value.length > 0
      ? field.value
      : undefined,
  );

  // Update selectedPaymentMethod when paymentMethodDetailData changes
  useEffect(() => {
    if (paymentMethodDetailData) {
      setSelectedPaymentMethod(paymentMethodDetailData);
    } else if (!field.value) {
      setSelectedPaymentMethod(null);
    }
  }, [paymentMethodDetailData, field.value]);

  const handleClear = () => {
    field.onChange('');
    setSelectedPaymentMethod(null);
    onPaymentMethodSelect?.(null);
  };

  const openPaymentMethodSelector = () => {
    if (!enabled) return;

    SheetManager.show('payment-method-selector', {
      currentPaymentMethodId: field.value,
      enabledOnly: enabledOnly,
      onSelect: (paymentMethod: PaymentMethod) => {
        field.onChange(paymentMethod.id);
        setSelectedPaymentMethod(paymentMethod);
        onPaymentMethodSelect?.(paymentMethod);
      },
    });
  };

  return (
    <FormControl isInvalid={!!fieldState.error}>
      <VStack className="gap-1">
        {label && <Text className="font-medium text-gray-900">{label}</Text>}

        {description && (
          <FormControlHelper>
            <FormControlHelperText>{description}</FormControlHelperText>
          </FormControlHelper>
        )}

        <Pressable onPress={openPaymentMethodSelector} disabled={!enabled}>
          <View
            className={`
            bg-white 
            border 
            ${fieldState.error ? 'border-red-500' : 'border-gray-300'} 
            rounded-lg 
            px-4
            py-4
            min-h-[60px]
            ${!enabled ? 'opacity-50' : ''}
          `}
          >
            <HStack className="justify-between items-center flex-1">
              {selectedPaymentMethod ? (
                <VStack className="flex-1 gap-0.5">
                  <Text className="text-gray-900 font-medium">{selectedPaymentMethod.name}</Text>
                  {selectedPaymentMethod.code && (
                    <Text className="text-xs text-gray-500">
                      Código: {selectedPaymentMethod.code}
                    </Text>
                  )}
                </VStack>
              ) : (
                <Text className="flex-1 text-gray-400">{placeholder}</Text>
              )}
              <HStack className="gap-2 items-center">
                {allowClear && field.value && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    className="p-1"
                  >
                    <Icon as={XIcon} className="text-gray-400" size="sm" />
                  </Pressable>
                )}
                <Icon as={ChevronDownIcon} className="text-gray-400" size="md" />
              </HStack>
            </HStack>
          </View>
        </Pressable>

        {fieldState.error && (
          <FormControlError>
            <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
          </FormControlError>
        )}
      </VStack>
    </FormControl>
  );
}
