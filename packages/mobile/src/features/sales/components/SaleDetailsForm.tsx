import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { VStack } from '@/components/ui/vstack';
import { ClientSelector } from '@/features/clients/components/ClientSelector';
import { FileSelector } from '@/features/files/components/FileSelector';
import { PaymentMethodSelectorField } from '@/features/payment-methods/components/PaymentMethodSelectorField';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { PaymentStatusField } from '@/components/forms/PaymentStatusField';
import { useSaleDetailsStore } from '../stores/useSaleDetailsStore';
import type { PaymentStatus } from '../types';
import type { Client } from '@gymspace/sdk';

interface SaleDetailsFormData {
  clientId: string;
  notes: string;
  fileIds: string[];
  paymentMethodId: string;
  paymentStatus: PaymentStatus;
}

export const SaleDetailsForm: React.FC = () => {
  const { details, setSaleDetails, setClient } = useSaleDetailsStore();

  const methods = useForm<SaleDetailsFormData>({
    defaultValues: {
      clientId: '',
      notes: details.notes || '',
      fileIds: details.fileIds || [],
      paymentMethodId: details.paymentMethodId || '',
      paymentStatus: details.paymentStatus || 'paid',
    },
  });

  const { control, watch } = methods;

  // Watch all form values
  const formValues = watch();

  // Update store when form values change
  useEffect(() => {
    setSaleDetails({
      notes: formValues.notes,
      paymentMethodId: formValues.paymentMethodId || null,
      fileIds: formValues.fileIds || [],
      paymentStatus: formValues.paymentStatus,
    });
  }, [formValues, setSaleDetails]);

  const handleClientSelect = (client: Client | null) => {
    setClient(client);
  };

  return (
    <FormProvider {...methods}>
      <VStack space="md">
        {/* Client Selector */}
        <ClientSelector
          name="clientId"
          control={control}
          label="Cliente (opcional)"
          placeholder="Seleccionar cliente"
          allowClear={true}
          onClientSelect={handleClientSelect}
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
          control={control}
          label="Estado de pago"
        />

        {/* Payment Method Selector */}
        <PaymentMethodSelectorField
          name="paymentMethodId"
          control={control}
          label="Método de Pago"
          placeholder="Seleccionar método de pago"
          description="Seleccione el método de pago utilizado para esta venta"
          allowClear={true}
          enabledOnly={true}
        />

        {/* File Attachments */}
        <FileSelector 
          name="fileIds" 
          multi={true} 
          label="Archivos adjuntos (opcional)"
        />
      </VStack>
    </FormProvider>
  );
};