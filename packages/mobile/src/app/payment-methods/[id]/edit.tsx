import { Button, ButtonText } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { EditPaymentMethodForm } from '@/features/payment-methods/components/EditPaymentMethodForm';
import { usePaymentMethodsController } from '@/features/payment-methods/controllers/payment-methods.controller';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function EditPaymentMethodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usePaymentMethodDetail } = usePaymentMethodsController();

  const { data: paymentMethod, isLoading, error } = usePaymentMethodDetail(id);

  if (isLoading) {
    return (
      <VStack className="flex-1 items-center justify-center">
        <Spinner className="text-primary-600" />
        <Text className="text-gray-600 mt-2">Cargando método de pago...</Text>
      </VStack>
    );
  }

  if (error || !paymentMethod) {
    return (
      <VStack className="flex-1 items-center justify-center p-8">
        <Text className="text-gray-600 text-center mb-4">
          {error ? 'Error al cargar el método de pago' : 'Método de pago no encontrado'}
        </Text>
        <Button variant="outline" onPress={() => router.back()}>
          <ButtonText>Volver</ButtonText>
        </Button>
      </VStack>
    );
  }

  return <EditPaymentMethodForm initialData={paymentMethod} paymentMethodId={id} />;
}
