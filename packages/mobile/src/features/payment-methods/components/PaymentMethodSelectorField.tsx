import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { PaymentMethod } from '@gymspace/sdk';
import { ChevronDownIcon, XIcon } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import type { FieldValues, UseControllerProps } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { Modal, TouchableWithoutFeedback, View } from 'react-native';
import { usePaymentMethodsController } from '../controllers/payment-methods.controller';
import { PaymentMethodDetailsModal } from './PaymentMethodDetailsModal';
import { PaymentMethodModalHeader } from './PaymentMethodModalHeader';
import { PaymentMethodModalFooter } from './PaymentMethodModalFooter';
import { PaymentMethodSearchBar } from './PaymentMethodSearchBar';
import { PaymentMethodsListContainer } from './PaymentMethodsListContainer';
import {
  usePaymentMethodSelectorStore,
  usePaymentMethodMainModal,
  usePaymentMethodDetailsModal,
} from '../stores/payment-method-selector.store';

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

  // Business logic store
  const {
    searchQuery,
    tempValue,
    selectedPaymentMethod,
    detailsPaymentMethod,
    patch,
    selectPaymentMethod,
    clearSelection,
    confirmSelection,
    setDetailsPaymentMethod,
    initializeTempValue,
    resetSearchQuery,
  } = usePaymentMethodSelectorStore();

  // Modal disclosure stores
  const mainModal = usePaymentMethodMainModal();
  const detailsModal = usePaymentMethodDetailsModal();

  const { usePaymentMethodsList, usePaymentMethodDetail } = usePaymentMethodsController();

  // Fetch payment methods list with search
  const {
    data: paymentMethodsData,
    isLoading,
    error,
  } = usePaymentMethodsList({
    search: searchQuery,
    enabledOnly: enabledOnly,
    limit: 50,
    page: 1,
  });

  // Only fetch selected payment method details when field.value exists and is not empty
  const { data: paymentMethodDetailData } = usePaymentMethodDetail(
    field.value && typeof field.value === 'string' && field.value.length > 0
      ? field.value
      : undefined,
  );

  // Update selectedPaymentMethod when paymentMethodDetailData changes
  useEffect(() => {
    if (paymentMethodDetailData) {
      patch({ selectedPaymentMethod: paymentMethodDetailData });
    } else if (!field.value) {
      patch({ selectedPaymentMethod: null });
    }
  }, [paymentMethodDetailData, field.value, patch]);

  const paymentMethods = useMemo(() => {
    return paymentMethodsData?.data || [];
  }, [paymentMethodsData]);

  const handleSave = () => {
    field.onChange(tempValue);
    confirmSelection(paymentMethods, onPaymentMethodSelect);
    mainModal.closeModal();
  };

  const handleCancel = () => {
    mainModal.closeModal();
    resetSearchQuery();
  };

  const handleClear = () => {
    field.onChange('');
    clearSelection();
    onPaymentMethodSelect?.(null);
  };

  const openModal = () => {
    if (enabled) {
      initializeTempValue(field.value);
      mainModal.openModal();
    }
  };

  const openDetailsModal = (paymentMethod: PaymentMethod) => {
    setDetailsPaymentMethod(paymentMethod);
    detailsModal.openModal();
  };

  const closeDetailsModal = () => {
    detailsModal.closeModal();
    setDetailsPaymentMethod(null);
  };


  return (
    <>
      <FormControl isInvalid={!!fieldState.error}>
        <VStack className="gap-1">
          {label && <Text className="font-medium text-gray-900">{label}</Text>}

          {description && (
            <FormControlHelper>
              <FormControlHelperText>{description}</FormControlHelperText>
            </FormControlHelper>
          )}

          <Pressable onPress={openModal} disabled={!enabled}>
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

      <Modal
        visible={mainModal.open}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View className="flex-1 bg-black/50">
          <TouchableWithoutFeedback onPress={handleCancel}>
            <View className="flex-1" />
          </TouchableWithoutFeedback>

          <View className="bg-white rounded-t-3xl h-5/6">
            {/* Header */}
            <View className="px-6 py-4 border-b border-gray-200">
              <PaymentMethodModalHeader
                title={label || 'Seleccionar método de pago'}
                onClose={handleCancel}
              />
              <PaymentMethodSearchBar
                value={searchQuery}
                onChange={(text) => patch({ searchQuery: text })}
              />
            </View>

            {/* Payment Methods List */}
            <PaymentMethodsListContainer
              paymentMethods={paymentMethods}
              selectedId={tempValue}
              onSelectPaymentMethod={selectPaymentMethod}
              onViewDetails={openDetailsModal}
              isLoading={isLoading}
              error={error}
              searchQuery={searchQuery}
            />

            {/* Footer */}
            <PaymentMethodModalFooter
              onCancel={handleCancel}
              onSave={handleSave}
              saveDisabled={!tempValue}
            />
          </View>
        </View>
      </Modal>

      {/* Payment Method Details Modal */}
      <PaymentMethodDetailsModal
        visible={detailsModal.open}
        paymentMethod={detailsPaymentMethod}
        onClose={closeDetailsModal}
      />
    </>
  );
}
