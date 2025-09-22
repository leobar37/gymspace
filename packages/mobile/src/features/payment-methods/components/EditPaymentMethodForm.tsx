import { FormProvider } from '@/components/forms';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { PaymentMethodForm } from './PaymentMethodForm';
import { usePaymentMethodsController } from '../controllers/payment-methods.controller';
import { useLoadingScreen } from '@/shared/loading-screen';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React from 'react';
import { CheckIcon } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { updatePaymentMethodSchema, type UpdatePaymentMethodInput } from '../schemas';
import type { PaymentMethod } from '@gymspace/sdk';

interface PaymentMethodOption {
  name: string;
  code: string;
  description: string;
  enabled: boolean;
  metadata: {
    type: string;
    country: string;
    [key: string]: any;
  };
}

interface EditPaymentMethodFormProps {
  initialData: PaymentMethod;
  paymentMethodId: string;
}

export const EditPaymentMethodForm: React.FC<EditPaymentMethodFormProps> = ({
  initialData,
  paymentMethodId,
}) => {
  const { execute } = useLoadingScreen();
  const { updatePaymentMethod } = usePaymentMethodsController();

  // Transform PaymentMethod to PaymentMethodOption for form compatibility
  const transformToOption = (paymentMethod: PaymentMethod): PaymentMethodOption => ({
    name: paymentMethod.name,
    code: paymentMethod.code,
    description: paymentMethod.description || '',
    enabled: paymentMethod.enabled,
    metadata: {
      type: paymentMethod.metadata?.type || paymentMethod.code || 'custom',
      country: paymentMethod.metadata?.country || 'PE',
      phoneNumber: paymentMethod.metadata?.phoneNumber || '',
      accountName: paymentMethod.metadata?.accountName || '',
      qrImageId: paymentMethod.metadata?.qrImageId,
      instructions: paymentMethod.metadata?.instructions || '',
      ...paymentMethod.metadata, // Preserve any additional metadata fields
    },
  });

  const paymentMethodOption = transformToOption(initialData);

  // Prepare proper default values ensuring nested metadata structure
  const defaultMetadata = {
    type: initialData.metadata?.type || 'custom',
    country: initialData.metadata?.country || 'PE',
    phoneNumber: initialData.metadata?.phoneNumber || '',
    accountName: initialData.metadata?.accountName || '',
    qrImageId: initialData.metadata?.qrImageId || null,
    instructions: initialData.metadata?.instructions || '',
    ...initialData.metadata, // Preserve any additional metadata fields
  };

  const form = useForm<UpdatePaymentMethodInput>({
    resolver: zodResolver(updatePaymentMethodSchema),
    defaultValues: {
      name: initialData.name,
      code: initialData.code,
      description: initialData.description || '',
      enabled: initialData.enabled,
      metadata: defaultMetadata,
    },
    mode: 'onChange',
  });

  // No need to watch all form values - this causes unnecessary re-renders
  // Form validation and metadata updates are handled by the form schema

  const onSubmit = async (data: UpdatePaymentMethodInput) => {
    await execute(
      (async () => {
        // Prepare metadata, preserving existing metadata
        const metadata = {
          ...initialData.metadata,
          ...data.metadata,
        };

        const updateData = {
          ...data,
          metadata,
        };

        return updatePaymentMethod({ id: paymentMethodId, data: updateData });
      })(),
      {
        action: 'Actualizando método de pago...',
        successMessage: 'Método de pago actualizado exitosamente',
        successActions: [
          {
            label: 'Ver métodos',
            onPress: () => router.replace('/payment-methods'),
          },
        ],
        errorFormatter: (error: any) => {
          if (error?.response?.status === 409) {
            return 'El código o nombre del método de pago ya está en uso';
          }
          if (error?.response?.status === 404) {
            return 'El método de pago no fue encontrado';
          }
          if (error?.response?.status === 400) {
            return 'Los datos proporcionados no son válidos';
          }
          if (error?.message?.includes('code')) {
            return 'El código del método de pago ya está en uso';
          }
          if (error?.message?.includes('name')) {
            return 'El nombre del método de pago ya está en uso';
          }
          return 'Error al actualizar el método de pago. Inténtalo de nuevo.';
        },
      },
    );
  };

  // Check if form is dirty (touched) AND valid for button enabling
  const isButtonEnabled = form.formState.isDirty && form.formState.isValid && !form.formState.isSubmitting;

  return (
    <ScreenForm
      title="Editar Método de Pago"
      showBackButton={true}
      showFixedFooter={true}
      useSafeArea={false}
      footerContent={
        <Button
          size="lg"
          variant="solid"
          onPress={form.handleSubmit(onSubmit)}
          isDisabled={!isButtonEnabled}
        >
          <Icon as={CheckIcon} className="text-white mr-2" size="sm" />
          <ButtonText>
            {form.formState.isSubmitting ? 'Guardando cambios...' : 'Guardar cambios'}
          </ButtonText>
        </Button>
      }
    >
      {/* Payment Method Type Info */}
      <Card>
        <View className="p-4">
          <Text className="font-semibold text-gray-900 mb-2">Información del método</Text>
          <VStack space="xs">
            <Text className="text-sm text-gray-600">
              <Text className="font-medium">Tipo:</Text> {paymentMethodOption.name}
            </Text>
            <Text className="text-sm text-gray-600">
              <Text className="font-medium">Código:</Text> {paymentMethodOption.code}
            </Text>
          </VStack>
        </View>
      </Card>

      {/* Edit Form */}
      <Card>
        <View className="py-4 px-2">
          <Text className="font-semibold text-gray-900 mb-4">
            Configuración del método de pago
          </Text>

          <FormProvider {...form}>
            <PaymentMethodForm paymentMethod={paymentMethodOption} />
          </FormProvider>

          {/* Validation Errors Summary */}
          {Object.keys(form.formState.errors).length > 0 && (
            <VStack space="xs" className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Text className="text-sm font-medium text-red-800">
                Por favor corrige los siguientes errores:
              </Text>
              {Object.entries(form.formState.errors).map(([field, error]) => (
                <Text key={field} className="text-xs text-red-700">
                  • {typeof error?.message === 'string' ? error.message : `Error en ${field}`}
                </Text>
              ))}
            </VStack>
          )}
        </View>
      </Card>
    </ScreenForm>
  );
};
