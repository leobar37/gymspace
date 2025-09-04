import React from 'react';
import { VStack } from '@/components/ui/vstack';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react-native';

export const CardPaymentForm: React.FC = () => {
  return (
    <VStack space="md" className="w-full">
      <Alert variant="outline" action="info">
        <AlertIcon as={InfoIcon} />
        <AlertText>
          Los pagos con tarjeta se procesan a través del POS. Solo necesitas configurar el nombre y
          descripción.
        </AlertText>
      </Alert>
      <FormInput
        name="name"
        label="Nombre del método de pago"
        placeholder="Ej: Tarjeta - POS Principal"
      />
      <FormInput name="code" label="Código único" placeholder="Ej: CARD_001" />
      <FormTextarea
        name="description"
        label="Descripción (opcional)"
        placeholder="Describe este método de pago con tarjeta..."
        numberOfLines={3}
      />
    </VStack>
  );
};
