import React from 'react';
import { VStack } from '@/components/ui/vstack';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';

export const CustomPaymentForm: React.FC = () => {
  return (
    <VStack space="md" className="w-full">
      <FormInput
        name="name"
        label="Nombre del método de pago"
        placeholder="Ej: Transferencia bancaria"
      />

      <FormInput name="code" label="Código único" placeholder="Ej: CUSTOM_001" />

      <FormTextarea
        name="description"
        label="Descripción"
        placeholder="Describe este método de pago personalizado..."
        numberOfLines={4}
      />
    </VStack>
  );
};
