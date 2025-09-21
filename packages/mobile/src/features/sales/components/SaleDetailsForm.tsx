import React from 'react';
import { useWatch } from 'react-hook-form';
import { VStack } from '@/components/ui/vstack';
import { ClientSelector } from '@/features/clients/components/ClientSelector';
import { FileSelector } from '@/features/files/components/FileSelector';
import { PaymentMethodSelectorField } from '@/features/payment-methods/components/PaymentMethodSelectorField';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { PaymentStatusField } from '@/components/forms/PaymentStatusField';

export const SaleDetailsForm: React.FC = () => {
  const paymentStatus = useWatch({ name: 'paymentStatus' });
  const isPaymentPending = paymentStatus === 'unpaid';

  return (
    <VStack space="md">
      {/* Client Selector */}
      <ClientSelector
        name="client"
        label="Cliente (opcional)"
        placeholder="Seleccionar cliente"
        allowClear={true}
      />

      {/* Notes Input */}
      <FormTextarea
        name="notes"
        label="Notas (opcional)"
        placeholder="Agregar notas sobre la venta..."
        numberOfLines={3}
      />

      {/* Payment Status */}
      <PaymentStatusField
        name="paymentStatus"
        label="Estado de pago"
      />

      {/* Payment Method Selector */}
      {!isPaymentPending && (
        <PaymentMethodSelectorField
          name="paymentMethodId"
          label="Método de Pago"
          placeholder="Seleccionar método de pago"
          description="Seleccione el método de pago utilizado para esta venta"
          allowClear={true}
          enabledOnly={true}
        />
      )}

      {/* File Attachments */}
      {!isPaymentPending && (
        <FileSelector 
          name="fileIds" 
          multi={true} 
          label="Archivos adjuntos (opcional)"
        />
      )}
    </VStack>
  );
};