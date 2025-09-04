import { FormProvider } from '@/components/forms';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { PaymentMethodForm } from '@/features/payment-methods/components/PaymentMethodForm';
import { PaymentMethodSelector } from '@/features/payment-methods/components/PaymentMethodSelector';
import { usePaymentMethodsController } from '@/features/payment-methods/controllers/payment-methods.controller';
import { useLoadingScreen } from '@/shared/loading-screen';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { Fragment } from 'react';
import { CheckIcon } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as z from 'zod';

interface PaymentMethodOption {
  name: string;
  code: string;
  description: string;
  enabled: boolean;
  metadata: {
    type: string;
    country: string;
  };
}

// Base schema with common fields
const basePaymentMethodSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
});

// Extended schema for mobile payments
const mobilePaymentMethodSchema = basePaymentMethodSchema.extend({
  metadata: z.object({
    phoneNumber: z.string().min(9, 'El número de teléfono debe tener al menos 9 dígitos'),
    accountName: z.string().min(3, 'El nombre del titular debe tener al menos 3 caracteres'),
    qrImageId: z.string().optional(),
  }),
});

// Schema for custom payments that require description
const customPaymentMethodSchema = basePaymentMethodSchema.extend({
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
});

type PaymentMethodFormData = z.infer<typeof basePaymentMethodSchema> & {
  metadata?: {
    phoneNumber?: string;
    accountName?: string;
    qrImageId?: string;
  };
};

export default function CreatePaymentMethodScreen() {
  const params = useLocalSearchParams<{
    type?: string;
    name?: string;
    description?: string;
    metadata?: string;
  }>();

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    React.useState<PaymentMethodOption | null>(null);
  const [showSelector, setShowSelector] = React.useState(false);
  const { execute } = useLoadingScreen();
  const { createPaymentMethod } = usePaymentMethodsController();

  // Initialize selected payment method from params
  React.useEffect(() => {
    if (params.type && params.name) {
      const paymentMethod: PaymentMethodOption = {
        code: params.type,
        name: params.name,
        description: params.description || '',
        enabled: true,
        metadata: params.metadata ? JSON.parse(params.metadata) : { type: 'custom', country: 'PE' },
      };
      setSelectedPaymentMethod(paymentMethod);
    }
  }, []);

  // Determine the appropriate schema based on selected payment method
  const getSchema = (paymentMethod: PaymentMethodOption | null) => {
    if (!paymentMethod) return basePaymentMethodSchema;

    if (paymentMethod.code === 'yape' || paymentMethod.code === 'plin') {
      return mobilePaymentMethodSchema;
    }

    if (paymentMethod.code === 'custom') {
      return customPaymentMethodSchema;
    }

    return basePaymentMethodSchema;
  };

  const [currentSchema, setCurrentSchema] = React.useState(() => getSchema(selectedPaymentMethod));

  const form = useForm<PaymentMethodFormData>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      enabled: true,
    },
    mode: 'onChange',
  });

  // Reset form when payment method changes
  React.useEffect(() => {
    if (selectedPaymentMethod) {
      const newSchema = getSchema(selectedPaymentMethod);
      setCurrentSchema(newSchema);

      form.reset({
        name: selectedPaymentMethod.name === 'Otro' ? '' : selectedPaymentMethod.name,
        code: selectedPaymentMethod.code,
        description:
          selectedPaymentMethod.description === 'Agregar método de pago personalizado'
            ? ''
            : selectedPaymentMethod.description,
        enabled: true,
        metadata: undefined,
      });

      // Update the form resolver with the new schema
      form.clearErrors();
    }
  }, [selectedPaymentMethod, form]);

  const handleSelectPaymentMethod = (paymentMethod: PaymentMethodOption) => {
    setSelectedPaymentMethod(paymentMethod);
    setShowSelector(false);
  };

  const onSubmit = async (data: PaymentMethodFormData) => {
    if (!selectedPaymentMethod) return;

    await execute(
      (async () => {
        // Prepare metadata based on payment method type
        const metadata: Record<string, any> = {
          type: selectedPaymentMethod.metadata.type,
          country: selectedPaymentMethod.metadata.country,
        };

        // Add form metadata if it exists
        if (data.metadata) {
          Object.assign(metadata, data.metadata);
        }

        const paymentMethodData = {
          name: data.name,
          code: data.code,
          description: data.description || '',
          enabled: data.enabled,
          metadata,
        };

        return createPaymentMethod(paymentMethodData);
      })(),
      {
        action: 'Creando método de pago...',
        successMessage: 'Método de pago creado exitosamente',
        successActions: [
          {
            label: 'Ver métodos',
            onPress: () => router.replace('/payment-methods'),
          },
        ],
      },
    );
  };

  return (
    <Fragment>
      <ScrollView className="flex-1">
        <VStack>
          <Card>
            <View className="pb-3">
              <Text className="font-semibold text-gray-900">Tipo de método de pago</Text>
            </View>
            <View className="px-4 pb-4">
              {selectedPaymentMethod ? (
                <Pressable
                  onPress={() => setShowSelector(true)}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <HStack className="items-center justify-between">
                    <VStack space="xs">
                      <Text className="font-medium text-blue-900">
                        {selectedPaymentMethod.name}
                      </Text>
                      <Text className="text-sm text-blue-700">
                        {selectedPaymentMethod.description}
                      </Text>
                    </VStack>
                    <Text className="text-blue-600 text-sm font-medium">Cambiar</Text>
                  </HStack>
                </Pressable>
              ) : (
                <Button variant="outline" onPress={() => setShowSelector(true)}>
                  <ButtonText>Seleccionar tipo de método de pago</ButtonText>
                </Button>
              )}
            </View>
          </Card>
          {/* Payment Method Form */}
          {selectedPaymentMethod && (
            <Card>
              <View className="p-4 pb-3">
                <Text className="font-semibold text-gray-900">
                  Configuración del método de pago
                </Text>
              </View>
              <View className="px-4 pb-4">
                <FormProvider {...form}>
                  <PaymentMethodForm paymentMethod={selectedPaymentMethod} />
                </FormProvider>

                {/* Validation Errors Summary */}
                {Object.keys(form.formState.errors).length > 0 && (
                  <VStack
                    space="xs"
                    className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <Text className="text-sm font-medium text-red-800">
                      Por favor corrige los siguientes errores:
                    </Text>
                    {Object.entries(form.formState.errors).map(([field, error]) => (
                      <Text key={field} className="text-xs text-red-700">
                        • {error?.message}
                      </Text>
                    ))}
                  </VStack>
                )}
              </View>
            </Card>
          )}

          {/* Create Button */}
          {selectedPaymentMethod && (
            <Button
              size="lg"
              variant="solid"
              onPress={form.handleSubmit(onSubmit)}
              isDisabled={form.formState.isSubmitting || !form.formState.isValid}
              className="mx-4 mb-6"
            >
              <Icon as={CheckIcon} className="text-white mr-2" size="sm" />
              <ButtonText>
                {form.formState.isSubmitting ? 'Creando método de pago...' : 'Crear método de pago'}
              </ButtonText>
            </Button>
          )}
        </VStack>
      </ScrollView>

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onSelectPaymentMethod={handleSelectPaymentMethod}
      />
    </Fragment>
  );
}
