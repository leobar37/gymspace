import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
} from '@/components/ui/drawer';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  CreditCardIcon,
  SmartphoneIcon,
  PlusIcon,
  XIcon,
  BanknoteIcon,
} from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { PREDEFINED_PAYMENT_METHODS, PAYMENT_METHOD_TYPES, getPaymentMethodColor } from '../constants';
import type { PaymentMethodOption } from '../schemas';

interface PaymentMethodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaymentMethod: (paymentMethod: PaymentMethodOption) => void;
}

const getPaymentMethodIcon = (type: string) => {
  switch (type) {
    case PAYMENT_METHOD_TYPES.CASH:
      return BanknoteIcon;
    case PAYMENT_METHOD_TYPES.MOBILE:
      return SmartphoneIcon;
    case PAYMENT_METHOD_TYPES.CARD:
      return CreditCardIcon;
    default:
      return PlusIcon;
  }
};

interface PaymentMethodItemProps {
  paymentMethod: PaymentMethodOption;
  onSelect: (paymentMethod: PaymentMethodOption) => void;
}

const PaymentMethodItem: React.FC<PaymentMethodItemProps> = ({
  paymentMethod,
  onSelect,
}) => {
  const IconComponent = getPaymentMethodIcon(paymentMethod.metadata.type);
  const colorClass = getPaymentMethodColor(paymentMethod.code);

  return (
    <Pressable
      onPress={() => onSelect(paymentMethod)}
      className="mb-3 p-4 bg-white rounded-lg border border-gray-200 active:bg-gray-50"
    >
      <HStack className="items-center gap-4">
        <View className={`p-3 rounded-full ${colorClass.split(' ')[0]}`}>
          <Icon as={IconComponent} className={colorClass.split(' ')[1]} size="lg" />
        </View>

        <VStack className="flex-1">
          <Text className="font-semibold text-gray-900 text-lg">
            {paymentMethod.name}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {paymentMethod.description}
          </Text>
        </VStack>
      </HStack>
    </Pressable>
  );
};

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  isOpen,
  onClose,
  onSelectPaymentMethod,
}) => {
  const handleOtherPaymentMethod = () => {
    const otherPaymentMethod: PaymentMethodOption = {
      name: 'Otro',
      code: 'custom',
      description: 'Agregar método de pago personalizado',
      enabled: true,
      metadata: {
        type: 'custom_payment',
        country: 'PE',
      },
    };
    onSelectPaymentMethod(otherPaymentMethod);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="md" anchor="bottom">
      <DrawerBackdrop />
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <HStack className="items-center justify-between w-full">
            <Heading size="lg" className="text-gray-900">
              Seleccionar método de pago
            </Heading>
            <Pressable onPress={onClose} className="p-2">
              <Icon as={XIcon} className="text-gray-600" size="lg" />
            </Pressable>
          </HStack>
        </DrawerHeader>

        <DrawerBody className="pt-2">
          <VStack className="gap-2">
            {PREDEFINED_PAYMENT_METHODS.map((paymentMethod) => (
              <PaymentMethodItem
                key={paymentMethod.code}
                paymentMethod={paymentMethod}
                onSelect={onSelectPaymentMethod}
              />
            ))}

            {/* Other payment method option */}
            <Pressable
              onPress={handleOtherPaymentMethod}
              className="mb-3 p-4 bg-white rounded-lg border border-gray-200 border-dashed active:bg-gray-50"
            >
              <HStack className="items-center gap-4">
                <View className="p-3 rounded-full bg-gray-100">
                  <Icon as={PlusIcon} className="text-gray-600" size="lg" />
                </View>

                <VStack className="flex-1">
                  <Text className="font-semibold text-gray-900 text-lg">
                    Otro método de pago
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Agregar un método de pago personalizado
                  </Text>
                </VStack>
              </HStack>
            </Pressable>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
