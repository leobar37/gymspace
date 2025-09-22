import React, { useCallback, useMemo } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetWrapper, SheetManager, SheetProps, BottomSheetFooter } from '@gymspace/sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMultiScreen, useMultiScreenContext } from '@/components/ui/multi-screen';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ArrowLeft, X as CloseIcon, Check, Search } from 'lucide-react-native';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Badge, BadgeText } from '@/components/ui/badge';
import { usePaymentMethodsController } from '../controllers/payment-methods.controller';
import type { PaymentMethod } from '@gymspace/sdk';
import { getPaymentMethodIcon, getPaymentMethodColor } from '../utils/payment-method-helpers';
import { getPaymentViewerStrategy } from '../strategies/payment-viewer-strategies';

export interface PaymentMethodSelectorPayload {
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

// Payment Method List Item Component
interface PaymentMethodListItemProps {
  paymentMethod: PaymentMethod;
  isSelected: boolean;
  onPress: (paymentMethod: PaymentMethod) => void;
}

const PaymentMethodListItem: React.FC<PaymentMethodListItemProps> = ({
  paymentMethod,
  isSelected,
  onPress,
}) => {
  const IconComponent = getPaymentMethodIcon(paymentMethod);
  const colorClasses = getPaymentMethodColor(paymentMethod.code);
  const bgColor = colorClasses.split(' ')[0];
  const textColor = colorClasses.split(' ')[1];

  return (
    <TouchableOpacity
      onPress={() => onPress(paymentMethod)}
      className={`p-4 border-b border-gray-100 ${isSelected ? 'bg-blue-50' : ''}`}
    >
      <HStack className="items-center gap-3">
        <View className={`w-12 h-12 rounded-full items-center justify-center ${bgColor}`}>
          <Icon as={IconComponent} className={textColor} size="md" />
        </View>
        
        <VStack className="flex-1 gap-1">
          <HStack className="items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">{paymentMethod.name}</Text>
            {isSelected && (
              <Icon as={Check} className="text-blue-600" size="sm" />
            )}
          </HStack>
          <Text className="text-sm text-gray-600">{paymentMethod.code}</Text>
          
          <HStack className="items-center gap-2 mt-1">
            <Badge variant="solid" action={paymentMethod.enabled ? 'success' : 'muted'} size="sm">
              <BadgeText>{paymentMethod.enabled ? 'Activo' : 'Inactivo'}</BadgeText>
            </Badge>
          </HStack>
        </VStack>
      </HStack>
    </TouchableOpacity>
  );
};

// Payment Method List Screen
const PaymentMethodListScreen: React.FC = () => {
  const payload = React.useContext(PayloadContext);
  const { router } = useMultiScreenContext();
  const { usePaymentMethodsList } = usePaymentMethodsController();
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: paymentMethodsResponse, isLoading } = usePaymentMethodsList({
    active: true,
    search: searchQuery || undefined,
  });

  const paymentMethods = useMemo(() => {
    return paymentMethodsResponse?.data || [];
  }, [paymentMethodsResponse]);

  const filteredPaymentMethods = useMemo(() => {
    if (!searchQuery) return paymentMethods;
    return paymentMethods.filter(pm => 
      pm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pm.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [paymentMethods, searchQuery]);

  const handleSelectPaymentMethod = useCallback(
    (paymentMethod: PaymentMethod) => {
      router.navigate('details', { props: { paymentMethod } });
    },
    [router],
  );

  const handleClose = useCallback(() => {
    payload?.onCancel?.();
    SheetManager.hide('payment-method-selector');
  }, [payload]);

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
    <PaymentMethodListItem
      paymentMethod={item}
      isSelected={item.id === payload?.currentPaymentMethodId}
      onPress={handleSelectPaymentMethod}
    />
  );

  return (
    <>
      <NavigationHeader
        title="Seleccionar Método de Pago"
        onClose={handleClose}
      />
      
      <View className="flex-1">
        {/* Search Input */}
        <View className="p-4 border-b border-gray-200">
          <Input>
            <InputSlot className="pl-3">
              <InputIcon as={Search} className="text-gray-400" />
            </InputSlot>
            <InputField
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="pl-2"
            />
          </Input>
        </View>

        {/* Payment Methods List */}
        <FlatList
          data={filteredPaymentMethods}
          renderItem={renderPaymentMethod}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8">
              <Text className="text-gray-500 text-center">
                {isLoading ? 'Cargando métodos de pago...' : 'No hay métodos de pago disponibles'}
              </Text>
            </View>
          }
        />
      </View>
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

  const strategy = getPaymentViewerStrategy(paymentMethod);
  const IconComponent = getPaymentMethodIcon(paymentMethod);
  const colorClasses = getPaymentMethodColor(paymentMethod.code);
  const bgColor = colorClasses.split(' ')[0];
  const textColor = colorClasses.split(' ')[1];

  const renderFooter = useCallback(() => (
    <BottomSheetFooter>
      <View className="px-4 py-4 bg-white border-t border-gray-200">
        <VStack className="gap-3">
          {paymentMethod.enabled ? (
            <Button size="lg" onPress={handleSelectPaymentMethod}>
              <Icon as={Check} className="mr-2" size="md" />
              <ButtonText>Seleccionar este método</ButtonText>
            </Button>
          ) : (
            <View className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <HStack className="items-center gap-2">
                <Icon as={Check} className="text-amber-600" size="sm" />
                <Text className="text-amber-800 text-sm">
                  Este método de pago está desactivado y no puede ser seleccionado
                </Text>
              </HStack>
            </View>
          )}
        </VStack>
      </View>
    </BottomSheetFooter>
  ), [paymentMethod.enabled, handleSelectPaymentMethod]);

  return (
    <>
      <NavigationHeader
        title="Detalles del Método"
        subtitle={paymentMethod.name}
        onClose={handleClose}
      />
      
      <View className="flex-1">
        {/* Header with icon and basic info */}
        <View className="px-4 py-6 border-b border-gray-200">
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
        </View>

        {/* Strategy-based content */}
        <View className="flex-1 px-4 py-4">
          <strategy.Component paymentMethod={paymentMethod} />
        </View>
      </View>
      
      {renderFooter()}
    </>
  );
};

// Create MultiScreen flow
const paymentMethodSelectorFlow = createMultiScreen()
  .addStep('list', PaymentMethodListScreen)
  .addStep('details', PaymentMethodDetailsScreen)
  .build();

const { Component } = paymentMethodSelectorFlow;

// Main Sheet Component
interface PaymentMethodSelectorSheetProps extends SheetProps, PaymentMethodSelectorPayload {}

function PaymentMethodSelectorSheet(props: PaymentMethodSelectorSheetProps) {
  const insets = useSafeAreaInsets();

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