import React, { useCallback } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { BottomSheetWrapper, SheetManager, SheetProps } from '@gymspace/sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMultiScreen, useMultiScreenContext } from '@/components/ui/multi-screen';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ArrowLeft, X as CloseIcon, Check } from 'lucide-react-native';
import { useLoadingScreen } from '@/shared/loading-screen';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/forms';
import { PaymentMethodsListGeneric } from './PaymentMethodsList.generic';
import { usePaymentMethodsController } from '../controllers/payment-methods.controller';
import type { PaymentMethod, CreatePaymentMethodDto } from '@gymspace/sdk';
import { getPaymentMethodIcon, getPaymentMethodColor } from '../utils/payment-method-helpers';
import { Badge, BadgeText } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';

export interface PaymentMethodSelectorPayload {
  mode?: 'select' | 'create';
  currentPaymentMethodId?: string;
  onSelect: (paymentMethod: PaymentMethod) => void;
  onCancel?: () => void;
}

// Context for payload
const PayloadContext = React.createContext<PaymentMethodSelectorPayload | undefined>(undefined);

// Navigation Header Component
interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({ title, subtitle, onClose }) => {
  const { router } = useMultiScreenContext();
  const canGoBack = router.canGoBack;

  return (
    <View className="px-4 py-3 border-b border-gray-200 bg-white">
      <HStack className="items-center justify-between">
        {/* Left side - Back button or empty space */}
        <View className="w-10">
          {canGoBack && (
            <Button variant="link" size="sm" onPress={() => router.goBack()} className="p-0">
              <Icon as={ArrowLeft} className="text-gray-700" size="md" />
            </Button>
          )}
        </View>

        {/* Center - Title */}
        <View className="flex-1 items-center">
          <Text className="text-base font-semibold text-gray-900">{title}</Text>
          {subtitle && <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>}
        </View>

        {/* Right side - Close button */}
        <View className="w-10">
          <Button variant="link" size="sm" onPress={onClose} className="p-0">
            <Icon as={CloseIcon} className="text-gray-700" size="md" />
          </Button>
        </View>
      </HStack>
    </View>
  );
};

// Payment Method List Screen
const PaymentMethodListScreen: React.FC = () => {
  const payload = React.useContext(PayloadContext);
  const { router } = useMultiScreenContext();

  const handleSelectPaymentMethod = useCallback(
    (paymentMethod: PaymentMethod) => {
      // Navigate to details screen instead of direct selection
      router.navigate('details', { props: { paymentMethod } });
    },
    [router],
  );

  const handleClose = useCallback(() => {
    payload?.onCancel?.();
    SheetManager.hide('payment-method-selector');
  }, [payload]);

  const handleCreateNew = useCallback(() => {
    router.navigate('create');
  }, [router]);

  console.log("payload in list screen", payload);
  
  return (
    <>
      <NavigationHeader
        title={payload?.mode === 'create' ? 'Crear Método de Pago' : 'Seleccionar Método de Pago'}
        onClose={handleClose}
      />
      <PaymentMethodsListGeneric
        selectedPaymentMethodId={payload?.currentPaymentMethodId}
        onPaymentMethodSelect={handleSelectPaymentMethod}
        activeOnly={true}
        searchPlaceholder="Buscar por nombre o código..."
        showAddButton={true}
        onAddPaymentMethod={handleCreateNew}
        isSheet={true}
        emptyMessage={
          payload?.mode === 'create'
            ? 'No hay métodos de pago disponibles para crear'
            : 'No hay métodos de pago disponibles'
        }
      />
    </>
  );
};

// Payment Method Details Screen
interface PaymentMethodDetailsScreenProps {
  paymentMethod?: PaymentMethod;
}

const PaymentMethodDetailsScreen: React.FC = () => {
  const payload = React.useContext(PayloadContext);
  const { router } = useMultiScreenContext();
  
  // Get payment method from router props
  const { paymentMethod } = router.props as PaymentMethodDetailsScreenProps;

  const handleClose = useCallback(() => {
    payload?.onCancel?.();
    SheetManager.hide('payment-method-selector');
  }, [payload]);

  const handleSelectPaymentMethod = useCallback(() => {
    if (paymentMethod && payload?.onSelect) {
      console.log('Selecting payment method from details:', paymentMethod);
      payload.onSelect(paymentMethod);
      SheetManager.hide('payment-method-selector');
    }
  }, [paymentMethod, payload]);

  if (!paymentMethod) {
    return (
      <>
        <NavigationHeader
          title="Detalles del Método"
          onClose={handleClose}
        />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-gray-500">No se encontró información del método de pago</Text>
          <Button variant="outline" size="md" onPress={() => router.goBack()} className="mt-4">
            <ButtonText>Volver</ButtonText>
          </Button>
        </View>
      </>
    );
  }

  const IconComponent = getPaymentMethodIcon(paymentMethod);
  const colorClass = getPaymentMethodColor(paymentMethod.code);
  const bgColor = colorClass.split(' ')[0];
  const textColor = colorClass.split(' ')[1];

  return (
    <>
      <NavigationHeader
        title="Detalles del Método"
        subtitle={paymentMethod.name}
        onClose={handleClose}
      />
      
      <View className="flex-1 px-4 py-6">
        <VStack className="gap-6">
          {/* Payment Method Icon and Basic Info */}
          <VStack className="items-center gap-4">
            <View className={`w-20 h-20 rounded-full items-center justify-center ${bgColor}`}>
              <Icon as={IconComponent} className={textColor} size="xl" />
            </View>
            
            <VStack className="items-center gap-2">
              <Text className="text-2xl font-bold text-gray-900">{paymentMethod.name}</Text>
              <Text className="text-lg font-mono text-gray-600">{paymentMethod.code}</Text>
              <Badge variant="solid" action={paymentMethod.enabled ? 'success' : 'muted'} size="md">
                <BadgeText>{paymentMethod.enabled ? 'Activo' : 'Inactivo'}</BadgeText>
              </Badge>
            </VStack>
          </VStack>

          {/* Description */}
          {paymentMethod.description && (
            <VStack className="gap-2">
              <Text className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Descripción
              </Text>
              <View className="bg-gray-50 rounded-lg p-4">
                <Text className="text-gray-700 leading-relaxed">
                  {paymentMethod.description}
                </Text>
              </View>
            </VStack>
          )}

          {/* Additional Information */}
          <VStack className="gap-4">
            <Text className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Información Adicional
            </Text>
            
            <VStack className="gap-3">
              <HStack className="justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-600">ID</Text>
                <Text className="font-mono text-gray-900">{paymentMethod.id}</Text>
              </HStack>

              <HStack className="justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-600">Estado</Text>
                <Badge variant="solid" action={paymentMethod.enabled ? 'success' : 'muted'} size="sm">
                  <BadgeText>{paymentMethod.enabled ? 'Activo' : 'Inactivo'}</BadgeText>
                </Badge>
              </HStack>

              {paymentMethod.metadata?.type && (
                <HStack className="justify-between items-center py-3 border-b border-gray-100">
                  <Text className="text-gray-600">Tipo</Text>
                  <Text className="text-gray-900 capitalize">{paymentMethod.metadata.type}</Text>
                </HStack>
              )}

              {paymentMethod.metadata?.country && (
                <HStack className="justify-between items-center py-3 border-b border-gray-100">
                  <Text className="text-gray-600">País</Text>
                  <Text className="text-gray-900 uppercase">{paymentMethod.metadata.country}</Text>
                </HStack>
              )}

              {paymentMethod.createdAt && (
                <HStack className="justify-between items-center py-3">
                  <Text className="text-gray-600">Fecha de creación</Text>
                  <Text className="text-gray-900">
                    {new Date(paymentMethod.createdAt).toLocaleDateString()}
                  </Text>
                </HStack>
              )}
            </VStack>
          </VStack>

          {/* Action Buttons */}
          <View className="mt-auto pt-6">
            <VStack className="gap-3">
              {paymentMethod.enabled && (
                <Button size="lg" onPress={handleSelectPaymentMethod}>
                  <Icon as={Check} className="mr-2" size="md" />
                  <ButtonText>Seleccionar este método</ButtonText>
                </Button>
              )}
              
              {!paymentMethod.enabled && (
                <View className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <HStack className="items-center gap-2">
                    <Icon as={Check} className="text-amber-600" size="sm" />
                    <Text className="text-amber-800 text-sm">
                      Este método de pago está desactivado y no puede ser seleccionado
                    </Text>
                  </HStack>
                </View>
              )}

              <Button
                variant="outline"
                size="lg"
                onPress={() => router.goBack()}
              >
                <ButtonText>Volver a la lista</ButtonText>
              </Button>
            </VStack>
          </View>
        </VStack>
      </View>
    </>
  );
};

// Quick Create Payment Method Screen
const QuickCreatePaymentMethodScreen: React.FC = () => {
  const payload = React.useContext(PayloadContext);
  const { router } = useMultiScreenContext();
  const { execute } = useLoadingScreen();
  const { sdk } = useGymSdk();

  // Create mutation for payment method
  const createPaymentMethodMutation = useMutation({
    mutationFn: async (data: CreatePaymentMethodDto) => {
      const response = await sdk.paymentMethods.createPaymentMethod(data);
      return response;
    },
  });

  // Create validation schema
  const schema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    code: z.string().min(1, 'El código es requerido'),
    description: z.string().optional(),
    enabled: z.boolean().default(true),
  });

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      enabled: true,
    },
  });

  const handleClose = useCallback(() => {
    payload?.onCancel?.();
    SheetManager.hide('payment-method-selector');
  }, [payload]);

  const onSubmit = form.handleSubmit(async (data) => {
    await execute({
      action: 'Creando método de pago...',
      fn: async () => {
        const createData: CreatePaymentMethodDto = {
          name: data.name,
          code: data.code,
          description: data.description || '',
          enabled: data.enabled,
          metadata: {
            type: 'custom_payment',
            country: 'PE',
          },
        };

        const newPaymentMethod = await createPaymentMethodMutation.mutateAsync(createData);

        // Navigate back to list to show the updated data
        router.navigate('list');

        // Select the newly created payment method
        payload?.onSelect(newPaymentMethod);
        SheetManager.hide('payment-method-selector');
      },
      successMessage: 'Método de pago creado correctamente',
    });
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <NavigationHeader
        title="Nuevo Método de Pago Rápido"
        subtitle="Información básica"
        onClose={handleClose}
      />

      <FormProvider {...form}>
        <View className="flex-1 px-4 py-4">
          <VStack className="gap-4">
            <Text className="text-sm text-gray-600">
              Ingrese los datos básicos del método de pago. La descripción es opcional. Podrá
              completar más información después.
            </Text>

            <FormInput
              name="name"
              label="Nombre del método"
              placeholder="Ej: Efectivo, Transferencia bancaria"
              autoCapitalize="words"
            />

            <FormInput
              name="code"
              label="Código identificador"
              placeholder="Ej: cash, transfer"
              autoCapitalize="none"
            />

            <FormInput
              name="description"
              label="Descripción (opcional)"
              placeholder="Descripción del método de pago"
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
            />
          </VStack>

          <View className="mt-auto pt-4">
            <HStack className="gap-3">
              <Button
                variant="outline"
                size="md"
                onPress={() => router.goBack()}
                className="flex-1"
              >
                <ButtonText>Cancelar</ButtonText>
              </Button>
              <Button size="md" onPress={onSubmit} className="flex-1">
                <ButtonText>Crear Método</ButtonText>
              </Button>
            </HStack>
          </View>
        </View>
      </FormProvider>
    </KeyboardAvoidingView>
  );
};

// Create MultiScreen flow
const paymentMethodSelectorFlow = createMultiScreen()
  .addStep('list', PaymentMethodListScreen)
  .addStep('details', PaymentMethodDetailsScreen)
  .addStep('create', QuickCreatePaymentMethodScreen)
  .build();

const { Component } = paymentMethodSelectorFlow;

// Main Sheet Component
interface PaymentMethodSelectorSheetProps extends SheetProps, PaymentMethodSelectorPayload {}

function PaymentMethodSelectorSheet(props: PaymentMethodSelectorSheetProps) {
  const insets = useSafeAreaInsets();

  console.log('props', props);

  return (
    <BottomSheetWrapper
      sheetId="payment-method-selector"
      snapPoints={['85%']}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: 'white',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
      handleIndicatorStyle={{
        backgroundColor: '#D1D5DB',
        width: 100,
        height: 4,
      }}
    >
      <View
        style={{
          height: '100%',
          paddingBottom: insets.bottom || 20,
        }}
      >
        <PayloadContext.Provider value={props}>
          <Component />
        </PayloadContext.Provider>
      </View>
    </BottomSheetWrapper>
  );
}

export default PaymentMethodSelectorSheet;