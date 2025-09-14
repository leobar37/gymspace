import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { EditIcon, CreditCardIcon, TrashIcon } from 'lucide-react-native';
import { usePaymentMethodsController } from '@/features/payment-methods/controllers/payment-methods.controller';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PreviewFile } from '@/features/files/components/FilePreview';

export default function PaymentMethodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usePaymentMethodDetail, toggleStatus, isTogglingStatus } = usePaymentMethodsController();
  
  const { data: paymentMethod, isLoading, error } = usePaymentMethodDetail(id);

  const handleToggleStatus = () => {
    if (paymentMethod) {
      toggleStatus(paymentMethod.id);
    }
  };

  const handleEditPress = () => {
    router.push(`/payment-methods/${id}/edit`);
  };

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

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <VStack className="p-4" space="lg">
        {/* Header Card with Status */}
        <Card className="p-5">
          <VStack space="md">
            <HStack className="items-center justify-between">
              <HStack className="items-center gap-3 flex-1">
                <View className="bg-primary-50 p-3 rounded-full">
                  <Icon as={CreditCardIcon} className="text-primary-600" size="lg" />
                </View>
                <Text className="text-xl font-semibold text-gray-900 flex-1">
                  {paymentMethod.name}
                </Text>
              </HStack>
              <Badge variant="solid" action={paymentMethod.enabled ? 'success' : 'muted'} size="md">
                <BadgeText>{paymentMethod.enabled ? 'ACTIVO' : 'INACTIVO'}</BadgeText>
              </Badge>
            </HStack>

            <VStack space="md" className="mt-2">
              <VStack space="xs">
                <Text className="text-xs uppercase tracking-wider text-gray-500 font-medium">Código</Text>
                <Text className="text-base text-gray-900 font-mono font-semibold">{paymentMethod.code}</Text>
              </VStack>

              {paymentMethod.description && (
                <VStack space="xs">
                  <Text className="text-xs uppercase tracking-wider text-gray-500 font-medium">Descripción</Text>
                  <Text className="text-base text-gray-700">{paymentMethod.description}</Text>
                </VStack>
              )}
            </VStack>
          </VStack>
        </Card>

        {/* Additional Information */}
        {paymentMethod.metadata && Object.keys(paymentMethod.metadata).length > 0 && (
          <Card className="p-5">
            <VStack space="lg">
              <Text className="text-lg font-semibold text-gray-900">
                Información adicional
              </Text>

              <VStack space="md">
                {Object.entries(paymentMethod.metadata).map(([key, value]) => {
                  // Skip empty or system values
                  if (!value || key === 'type' || key === 'country') return null;

                  // Check if this is a QR code file ID
                  const isQrCodeFile = key.toLowerCase().includes('qr') &&
                                     typeof value === 'string' &&
                                     value.match(/^[a-f0-9-]{36}/i);

                  // Format key display name properly
                  let displayKey = key;
                  if (key.toLowerCase().includes('qr')) {
                    displayKey = 'Código QR';
                  } else {
                    displayKey = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase())
                      .trim();
                  }

                  if (isQrCodeFile) {
                    return (
                      <VStack key={key} space="sm">
                        <Text className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                          {displayKey}
                        </Text>
                        <Card className="bg-white border border-gray-200 p-4">
                          <View className="items-center">
                            <PreviewFile
                              fileId={value as string}
                              width={250}
                              height={250}
                              resizeMode="contain"
                              fullscreenEnabled={true}
                            />
                          </View>
                        </Card>
                      </VStack>
                    );
                  }

                  return (
                    <VStack key={key} space="xs">
                      <Text className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                        {displayKey}
                      </Text>
                      <Text className="text-base text-gray-700">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </Text>
                    </VStack>
                  );
                })}
              </VStack>
            </VStack>
          </Card>
        )}

        {/* Actions */}
        <VStack space="md" className="mb-4">
          <Button
            variant="solid"
            onPress={handleEditPress}
            size="lg"
          >
            <Icon as={EditIcon} size="sm" />
            <ButtonText>Editar método de pago</ButtonText>
          </Button>

          <Button
            variant="outline"
            action={paymentMethod.enabled ? 'negative' : 'positive'}
            onPress={handleToggleStatus}
            isDisabled={isTogglingStatus}
            size="lg"
          >
            <ButtonText>
              {isTogglingStatus
                ? (paymentMethod.enabled ? 'Desactivando...' : 'Activando...')
                : (paymentMethod.enabled ? 'Desactivar' : 'Activar')
              }
            </ButtonText>
          </Button>
        </VStack>
      </VStack>
    </ScrollView>
  );
}