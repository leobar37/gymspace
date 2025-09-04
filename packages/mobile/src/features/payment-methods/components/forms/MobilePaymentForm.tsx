import React from 'react';
import { VStack } from '@/components/ui/vstack';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FileSelector } from '@/features/files/components/FileSelector';
import { Text } from '@/components/ui/text';

interface MobilePaymentFormProps {
  paymentType: 'yape' | 'plin';
}

export const MobilePaymentForm: React.FC<MobilePaymentFormProps> = ({ paymentType }) => {
  const paymentName = paymentType === 'yape' ? 'Yape' : 'Plin';

  return (
    <VStack space="md" className="w-full">
      <FormInput
        name="name"
        label="Nombre del método de pago"
        placeholder={`Ej: ${paymentName} - Principal`}
      />

      <FormInput
        name="code"
        label="Código único"
        placeholder={`Ej: ${paymentType.toUpperCase()}_001`}
      />

      <FormInput
        name="metadata.phoneNumber"
        label="Número de teléfono"
        placeholder="Ej: 999123456"
        keyboardType="phone-pad"
      />

      <FormInput
        name="metadata.accountName"
        label="Nombre del titular"
        placeholder="Ej: Juan Pérez"
      />

      <VStack space="sm" className="w-full">
        <Text className="text-sm font-medium text-gray-700">Código QR de {paymentName}</Text>
        <Text className="text-xs text-gray-500 mb-2">
          Sube una imagen del código QR que los clientes usarán para realizar pagos (opcional)
        </Text>
        <FileSelector  name="metadata.qrCodeFileId" />
      </VStack>

      <FormTextarea
        name="description"
        label="Descripción (opcional)"
        placeholder={`Describe este método de pago ${paymentName}...`}
        numberOfLines={3}
      />
    </VStack>
  );
};
