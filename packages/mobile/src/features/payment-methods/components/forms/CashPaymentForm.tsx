import React from 'react';
import { VStack } from '@/components/ui/vstack';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSwitch } from '@/components/forms/FormSwitch';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react-native';
import { Text } from '@/components/ui/text';

interface CashPaymentFormProps {
  // Optional props for future extensibility
  showInfo?: boolean;
}

export const CashPaymentForm: React.FC<CashPaymentFormProps> = ({ showInfo = true }) => {
  return (
    <VStack space="md" className="w-full">
      {/* Information Alert */}
      {showInfo && (
        <Alert variant="outline" action="info">
          <AlertIcon as={InfoIcon} size="sm" />
          <AlertText className="text-sm">
            El método de pago en efectivo permite recibir pagos directamente en el gimnasio.
            Asegúrate de llevar un control adecuado de estos pagos.
          </AlertText>
        </Alert>
      )}

      {/* Payment Method Name */}
      <FormInput
        name="name"
        label="Nombre del método de pago *"
        placeholder="Ej: Efectivo - Caja Principal"
        description="Identifica claramente este método de pago"
      />
      
      {/* Unique Code */}
      <FormInput
        name="code"
        label="Código único *"
        placeholder="Ej: CASH_001"
        description="Código interno para identificar este método"
        autoCapitalize="characters"
      />
      
      {/* Description */}
      <VStack space="sm" className="w-full">
        <FormTextarea
          name="description"
          label="Descripción"
          placeholder="Describe cómo se maneja este método de pago en efectivo..."
          numberOfLines={3}
        />
        <Text className="text-xs text-gray-500 ml-1">
          Opcional: Añade detalles sobre el proceso de pago
        </Text>
      </VStack>

      {/* Enable/Disable Switch */}
      <VStack space="sm" className="w-full">
        <FormSwitch
          name="enabled"
          label="Método activo"
        />
        <Text className="text-xs text-gray-500 ml-1">
          Activa o desactiva este método de pago según necesites
        </Text>
      </VStack>
    </VStack>
  );
};