import React from 'react';
import { Modal, View, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { XIcon, SmartphoneIcon } from 'lucide-react-native';
import type { PaymentMethod } from '@gymspace/sdk';
import { getPaymentViewerStrategy } from '../strategies/payment-viewer-strategies';
import { getPaymentMethodColor } from '../constants';

interface PaymentMethodDetailsModalProps {
  visible: boolean;
  paymentMethod: PaymentMethod | null;
  onClose: () => void;
}

export const PaymentMethodDetailsModal: React.FC<PaymentMethodDetailsModalProps> = ({
  visible,
  paymentMethod,
  onClose,
}) => {
  if (!paymentMethod) return null;

  const strategy = getPaymentViewerStrategy(paymentMethod);
  const colorClasses = getPaymentMethodColor(paymentMethod.code);

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1" />
        </TouchableWithoutFeedback>

        <View className="bg-white rounded-t-3xl max-h-5/6">
          {/* Header */}
          <View className="px-6 py-4 border-b border-gray-200">
            <HStack className="justify-between items-center">
              <HStack className="gap-3 items-center flex-1">
                <View className={`p-2 rounded-full ${colorClasses.split(' ')[0]}`}>
                  <Icon as={SmartphoneIcon} className={colorClasses.split(' ')[1]} size="sm" />
                </View>
                <VStack className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">{paymentMethod.name}</Text>
                  <Text className="text-xs text-gray-500">Código: {paymentMethod.code}</Text>
                </VStack>
              </HStack>
              <Pressable onPress={onClose} className="p-1">
                <Icon as={XIcon} className="text-gray-400" size="md" />
              </Pressable>
            </HStack>
          </View>

          {/* Content */}

          <strategy.Component paymentMethod={paymentMethod} />
          {/* Footer */}
          <View className="px-6 py-4 border-t border-gray-200">
            <Button variant="outline" size="md" onPress={onClose} className="w-full">
              <ButtonText>Cerrar</ButtonText>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
