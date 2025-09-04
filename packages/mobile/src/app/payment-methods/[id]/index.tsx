import React from 'react';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { BackButton } from '@/shared/components';
import { EditIcon, CreditCardIcon, TrashIcon } from 'lucide-react-native';
import { usePaymentMethodsController } from '@/features/payment-methods/controllers/payment-methods.controller';
import { ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-3 flex-1">
            <BackButton
              label=""
              onPress={() => router.back()}
            />
            <Text className="text-lg font-semibold text-gray-900">
              {paymentMethod.name}
            </Text>
          </HStack>
          <Pressable onPress={handleEditPress} className="p-2">
            <Icon as={EditIcon} size="sm" className="text-gray-600" />
          </Pressable>
        </HStack>
      </View>

      <ScrollView className="flex-1">
        <VStack className="p-4" space="lg">
          {/* Status and Basic Info */}
          <Card>
            <View className="p-4">
              <HStack className="items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">
                  {paymentMethod.name}
                </Text>
                <Badge variant="solid" action={paymentMethod.enabled ? 'success' : 'muted'}>
                  <BadgeText>{paymentMethod.enabled ? 'Activo' : 'Inactivo'}</BadgeText>
                </Badge>
              </HStack>
              
              <VStack space="sm">
                <HStack className="justify-between">
                  <Text className="text-sm font-medium text-gray-600">Código:</Text>
                  <Text className="text-sm text-gray-900 font-mono">{paymentMethod.code}</Text>
                </HStack>
                
                {paymentMethod.description && (
                  <VStack space="xs">
                    <Text className="text-sm font-medium text-gray-600">Descripción:</Text>
                    <Text className="text-sm text-gray-900">{paymentMethod.description}</Text>
                  </VStack>
                )}
              </VStack>
            </View>
          </Card>

          {/* Metadata */}
          {paymentMethod.metadata && Object.keys(paymentMethod.metadata).length > 0 && (
            <Card>
              <View className="p-4">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Información adicional
                </Text>
                <VStack space="sm">
                  {Object.entries(paymentMethod.metadata).map(([key, value]) => {
                    // Skip empty or system values
                    if (!value || key === 'type' || key === 'country') return null;
                    
                    // Format key display name
                    const displayKey = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase());
                    
                    return (
                      <HStack key={key} className="justify-between">
                        <Text className="text-sm font-medium text-gray-600 flex-1">
                          {displayKey}:
                        </Text>
                        <Text className="text-sm text-gray-900 flex-2 text-right">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </Text>
                      </HStack>
                    );
                  })}
                </VStack>
              </View>
            </Card>
          )}

          {/* Actions */}
          <VStack space="sm">
            <Button
              variant="outline"
              onPress={handleEditPress}
              size="lg"
            >
              <Icon as={EditIcon} className="text-gray-600 mr-2" size="sm" />
              <ButtonText>Editar método de pago</ButtonText>
            </Button>

            <Button
              variant="outline"
              action={paymentMethod.enabled ? 'negative' : 'positive'}
              onPress={handleToggleStatus}
              isDisabled={isTogglingStatus}
              size="lg"
            >
              <Icon 
                as={paymentMethod.enabled ? TrashIcon : CreditCardIcon} 
                className={paymentMethod.enabled ? 'text-red-600 mr-2' : 'text-green-600 mr-2'} 
                size="sm" 
              />
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
    </SafeAreaView>
  );
}