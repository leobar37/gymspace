import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { useLoadingScreen } from '@/shared/loading-screen';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react-native';
import type { AvailablePlanDto } from '@gymspace/sdk';

export default function SubscriptionPlansScreen() {
  const { sdk } = useGymSdk();
  const { organization, subscription } = useCurrentSession();
  const { execute } = useLoadingScreen();

  // Query to fetch available plans
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      return await sdk.subscriptions.getAvailablePlans();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Handle plan selection
  const handleSelectPlan = async (planId: string) => {
    if (!organization?.id) {
      Alert.alert('Error', 'No se encontró la organización');
      return;
    }

    // Check if this plan is already active
    if (subscription?.subscriptionPlanId === planId) {
      Alert.alert('Información', 'Este plan ya está activo');
      return;
    }

    await execute(
      async () => {
        await sdk.subscriptions.affiliateOrganization(organization.id, {
          subscriptionPlanId: planId,
        });
      },
      {
        action: 'Actualizando plan de suscripción...',
        successMessage: 'Plan actualizado exitosamente',
        errorFormatter: (error) => `Error al actualizar el plan: ${error.message}`,
      }
    );
  };

  const formatPrice = (price: any): string => {
    if (typeof price === 'object' && price !== null) {
      // Handle multi-currency pricing
      const currency = organization?.currency || 'USD';
      if (price[currency] !== undefined) {
        return `${currency} ${price[currency]}`;
      }
      // Fallback to first available price
      const firstCurrency = Object.keys(price)[0];
      return firstCurrency ? `${firstCurrency} ${price[firstCurrency]}` : 'Gratis';
    }
    if (typeof price === 'number') {
      return price === 0 ? 'Gratis' : `${organization?.currency || 'USD'} ${price}`;
    }
    return 'Gratis';
  };

  const isCurrentPlan = (planId: string): boolean => {
    return subscription?.subscriptionPlanId === planId;
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-muted-foreground">Cargando planes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-background p-4">
        <Text className="text-destructive text-center">
          Error al cargar los planes de suscripción
        </Text>
        <Text className="text-muted-foreground text-center mt-2">
          Por favor, intenta nuevamente más tarde
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Current Subscription Info */}
        {subscription && (
          <Card className="mb-6 border-primary">
            <CardHeader>
              <CardTitle>Plan Actual</CardTitle>
              <CardDescription>
                {subscription.subscriptionPlan?.name || 'Plan no disponible'}
              </CardDescription>
              <View className="mt-2">
                <Text className="text-sm text-muted-foreground">
                  Estado: {subscription.status === 'active' ? 'Activo' : subscription.status}
                </Text>
                {subscription.endDate && (
                  <Text className="text-sm text-muted-foreground">
                    Válido hasta: {new Date(subscription.endDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </CardHeader>
          </Card>
        )}

        {/* Available Plans */}
        <View className="space-y-4">
          <Text className="text-xl font-semibold mb-2">Planes Disponibles</Text>
          
          {plans && plans.length > 0 ? (
            plans.map((plan: AvailablePlanDto) => (
              <Card
                key={plan.id}
                className={isCurrentPlan(plan.id) ? 'border-primary' : 'border-border'}
              >
                <CardHeader>
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.description && (
                        <CardDescription className="mt-1">
                          {plan.description}
                        </CardDescription>
                      )}
                    </View>
                    <Text className="text-lg font-semibold text-primary">
                      {formatPrice(plan.price)}
                    </Text>
                  </View>

                  {/* Plan Features */}
                  <View className="mt-4 space-y-2">
                    <View className="flex-row items-center">
                      <Check size={16} className="text-green-600 mr-2" />
                      <Text className="text-sm">
                        Hasta {plan.maxGyms} {plan.maxGyms === 1 ? 'gimnasio' : 'gimnasios'}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Check size={16} className="text-green-600 mr-2" />
                      <Text className="text-sm">
                        Hasta {plan.maxClientsPerGym} clientes por gimnasio
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Check size={16} className="text-green-600 mr-2" />
                      <Text className="text-sm">
                        Hasta {plan.maxUsersPerGym} usuarios por gimnasio
                      </Text>
                    </View>

                    {/* Additional Features */}
                    {plan.features && typeof plan.features === 'object' && (
                      <View className="mt-2">
                        {Object.entries(plan.features).map(([key, value]) => {
                          if (typeof value === 'boolean') {
                            return (
                              <View key={key} className="flex-row items-center mt-1">
                                {value ? (
                                  <Check size={16} className="text-green-600 mr-2" />
                                ) : (
                                  <X size={16} className="text-red-600 mr-2" />
                                )}
                                <Text className="text-sm capitalize">
                                  {key.replace(/_/g, ' ')}
                                </Text>
                              </View>
                            );
                          }
                          return null;
                        })}
                      </View>
                    )}
                  </View>

                  {/* Billing Frequency */}
                  <View className="mt-3">
                    <Text className="text-xs text-muted-foreground">
                      Facturación: {plan.billingFrequency}
                    </Text>
                  </View>

                  {/* Action Button */}
                  <View className="mt-4">
                    {isCurrentPlan(plan.id) ? (
                      <Button variant="outline" disabled>
                        <Text>Plan Actual</Text>
                      </Button>
                    ) : (
                      <Button
                        variant="solid"
                        onPress={() => handleSelectPlan(plan.id)}
                      >
                        <Text className="text-white">Seleccionar Plan</Text>
                      </Button>
                    )}
                  </View>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardDescription>
                  No hay planes disponibles en este momento
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}