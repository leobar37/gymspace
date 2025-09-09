import React from 'react';
import { View } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { FilePreview, PreviewFile } from '@/features/files/components/FilePreview';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useQuery } from '@tanstack/react-query';
import {
  PhoneIcon,
  UserIcon,
  CreditCardIcon,
  BanknoteIcon,
  SmartphoneIcon,
} from 'lucide-react-native';
import type { PaymentMethod } from '@gymspace/sdk';
import type { MobilePaymentMetadata, CardPaymentMetadata } from '../schemas';
import { PAYMENT_METHOD_CODES } from '../constants';

interface PaymentViewerStrategyProps {
  paymentMethod: PaymentMethod;
}

export interface PaymentViewerStrategy {
  Component: React.FC<PaymentViewerStrategyProps>;
}

// Base component for displaying payment info row
const InfoRow: React.FC<{ icon: any; label: string; value: string }> = ({ icon, label, value }) => (
  <HStack className="gap-2 items-center py-2">
    <Icon as={icon} size="sm" className="text-gray-500" />
    <VStack className="flex-1">
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900">{value}</Text>
    </VStack>
  </HStack>
);

// Mobile Payment Strategy Component (Yape/Plin)
const MobilePaymentComponent: React.FC<PaymentViewerStrategyProps> = ({ paymentMethod }) => {
  const metadata = paymentMethod.metadata as MobilePaymentMetadata;

  console.log("metadata", JSON.stringify(metadata));
  
  return (
    <VStack space="md">
      {/* QR Code Section */}
      {paymentMethod.metadata.qrCodeFileId && (
        <VStack space="sm" className="items-center py-4">
          <Text className="text-sm font-medium text-gray-700">Código QR</Text>
          <View className="w-full items-center">
            <PreviewFile
              fileId={(metadata as any).qrCodeFileId}
              width={280}
              height={280}
              resizeMode="contain"
              fullscreenEnabled={true}
            />
          </View>
          <Text className="text-xs text-gray-500 text-center">
            Escanea este código QR con {paymentMethod.name}
          </Text>
        </VStack>
      )}

      {/* Payment Details */}
      <VStack className="bg-gray-50 rounded-lg p-4" space="sm">
        <Text className="text-sm font-semibold text-gray-900 mb-2">
          Detalles de {paymentMethod.name}
        </Text>

        {metadata?.phoneNumber && (
          <InfoRow icon={PhoneIcon} label="Número de teléfono" value={metadata.phoneNumber} />
        )}

        {metadata?.accountName && (
          <InfoRow icon={UserIcon} label="Titular de la cuenta" value={metadata.accountName} />
        )}
      </VStack>

      {/* Instructions */}
      {metadata?.instructions && (
        <VStack className="bg-blue-50 rounded-lg p-4" space="sm">
          <Text className="text-sm font-medium text-blue-900">Instrucciones</Text>
          <Text className="text-xs text-blue-700">{metadata.instructions}</Text>
        </VStack>
      )}
    </VStack>
  );
};

export const MobilePaymentStrategy: PaymentViewerStrategy = {
  Component: MobilePaymentComponent,
};

// Cash Payment Strategy Component
const CashPaymentComponent: React.FC<PaymentViewerStrategyProps> = ({ paymentMethod }) => {
  return (
    <VStack space="md">
      <VStack className="bg-gray-50 rounded-lg p-4 items-center" space="sm">
        <Icon as={BanknoteIcon} size="xl" className="text-green-600" />
        <Text className="text-lg font-semibold text-gray-900">Pago en Efectivo</Text>
        <Text className="text-sm text-gray-600 text-center">
          Este método acepta pagos en efectivo directamente en el gimnasio
        </Text>
      </VStack>

      {paymentMethod.description && (
        <VStack className="bg-blue-50 rounded-lg p-4" space="sm">
          <Text className="text-sm font-medium text-blue-900">Información adicional</Text>
          <Text className="text-xs text-blue-700">{paymentMethod.description}</Text>
        </VStack>
      )}
    </VStack>
  );
};

export const CashPaymentStrategy: PaymentViewerStrategy = {
  Component: CashPaymentComponent,
};

// Card Payment Strategy Component
const CardPaymentComponent: React.FC<PaymentViewerStrategyProps> = ({ paymentMethod }) => {
  const metadata = paymentMethod.metadata as CardPaymentMetadata;

  return (
    <VStack space="md">
      <VStack className="bg-gray-50 rounded-lg p-4 items-center" space="sm">
        <Icon as={CreditCardIcon} size="xl" className="text-blue-600" />
        <Text className="text-lg font-semibold text-gray-900">Pago con Tarjeta</Text>
        <Text className="text-sm text-gray-600 text-center">
          Acepta pagos con tarjeta de crédito or débito
        </Text>
      </VStack>

      <VStack className="bg-gray-50 rounded-lg p-4" space="sm">
        <Text className="text-sm font-semibold text-gray-900 mb-2">Detalles del servicio</Text>

        {metadata?.provider && (
          <InfoRow icon={CreditCardIcon} label="Proveedor" value={metadata.provider} />
        )}

        {metadata?.terminalId && (
          <InfoRow icon={SmartphoneIcon} label="ID del Terminal" value={metadata.terminalId} />
        )}
      </VStack>

      {paymentMethod.description && (
        <VStack className="bg-blue-50 rounded-lg p-4" space="sm">
          <Text className="text-sm font-medium text-blue-900">Información adicional</Text>
          <Text className="text-xs text-blue-700">{paymentMethod.description}</Text>
        </VStack>
      )}
    </VStack>
  );
};

export const CardPaymentStrategy: PaymentViewerStrategy = {
  Component: CardPaymentComponent,
};

// Custom Payment Strategy Component
const CustomPaymentComponent: React.FC<PaymentViewerStrategyProps> = ({ paymentMethod }) => {
  const metadata = paymentMethod.metadata as any;

  return (
    <VStack space="md">
      <VStack className="bg-gray-50 rounded-lg p-4" space="sm">
        <Text className="text-sm font-semibold text-gray-900 mb-2">{paymentMethod.name}</Text>

        {paymentMethod.description && (
          <Text className="text-sm text-gray-600">{paymentMethod.description}</Text>
        )}
      </VStack>

      {metadata?.instructions && (
        <VStack className="bg-blue-50 rounded-lg p-4" space="sm">
          <Text className="text-sm font-medium text-blue-900">Instrucciones</Text>
          <Text className="text-xs text-blue-700">{metadata.instructions}</Text>
        </VStack>
      )}
    </VStack>
  );
};

export const CustomPaymentStrategy: PaymentViewerStrategy = {
  Component: CustomPaymentComponent,
};

// Strategy factory
export const getPaymentViewerStrategy = (paymentMethod: PaymentMethod): PaymentViewerStrategy => {
  switch (paymentMethod.code.toLocaleLowerCase()) {
    case PAYMENT_METHOD_CODES.YAPE:
    case PAYMENT_METHOD_CODES.PLIN:
      return MobilePaymentStrategy;
    case PAYMENT_METHOD_CODES.CASH:
      return CashPaymentStrategy;
    case PAYMENT_METHOD_CODES.CARD:
      return CardPaymentStrategy;
    default:
      return CustomPaymentStrategy;
  }
};
