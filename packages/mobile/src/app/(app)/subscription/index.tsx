import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { useLoadingScreen } from '@/shared/loading-screen';
import { useFormatPrice } from '@/config/ConfigContext';
import { Card } from '@/components/ui/card';
import { Button, ButtonText } from '@/components/ui/button';
import { Check, X, Users, Building2, UserCheck, Clock } from 'lucide-react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import type { AvailablePlanDto } from '@gymspace/sdk';

// Component interfaces
interface UsageMeterProps {
  icon: React.ComponentType<any>;
  label: string;
  current: number;
  limit: number;
  iconColor: string;
  getUsagePercentage: (current: number, limit: number) => number;
  getUsageColor: (percentage: number) => string;
}

interface PlanActionButtonProps {
  isCurrentPlan: boolean;
  onSelectPlan: () => void;
}

// Extracted components for better reusability and performance
const UsageMeter = React.memo<UsageMeterProps>(({ 
  icon: Icon, 
  label, 
  current, 
  limit, 
  iconColor, 
  getUsagePercentage, 
  getUsageColor 
}) => {
  const percentage = getUsagePercentage(current, limit);
  
  return (
    <VStack className="gap-2">
      <HStack className="justify-between items-center">
        <HStack className="items-center gap-2">
          <Icon size={16} className={iconColor} />
          <Text className="text-sm font-medium">{label}</Text>
        </HStack>
        <Text className={`text-sm font-semibold ${getUsageColor(percentage)}`}>
          {current} de {limit}
        </Text>
      </HStack>
      <Progress value={percentage} className="h-2">
        <ProgressFilledTrack style={{ width: `${percentage}%` }} />
      </Progress>
    </VStack>
  );
});

const PlanActionButton = React.memo<PlanActionButtonProps>(({ isCurrentPlan, onSelectPlan }) => {
  if (isCurrentPlan) {
    return (
      <Button variant="outline" isDisabled>
        <ButtonText>Plan Actual</ButtonText>
      </Button>
    );
  }

  return (
    <Button variant="solid" onPress={onSelectPlan}>
      <ButtonText>Seleccionar Plan</ButtonText>
    </Button>
  );
});

// Set display names for debugging
UsageMeter.displayName = 'UsageMeter';
PlanActionButton.displayName = 'PlanActionButton';

// Constants
const QUERY_STALE_TIME = {
  PLANS: 10 * 60 * 1000, // 10 minutes
  LIMITS: 5 * 60 * 1000, // 5 minutes
} as const;

const USAGE_THRESHOLDS = {
  HIGH: 90,
  MEDIUM: 75,
} as const;

export default function SubscriptionPlansScreen() {
  const { sdk } = useGymSdk();
  const { organization, subscription } = useCurrentSession();
  const { execute } = useLoadingScreen();
  const formatPrice = useFormatPrice();
  const queryClient = useQueryClient();

  // Memoized query keys
  const queryKeys = useMemo(() => ({
    plans: ['subscription-plans'] as const,
    limits: (orgId: string, type: string) => ['subscription-limits', type, orgId] as const,
  }), []);

  // Query to fetch available plans
  const { data: plans, isLoading, error } = useQuery({
    queryKey: queryKeys.plans,
    queryFn: () => sdk.subscriptions.getAvailablePlans(),
    staleTime: QUERY_STALE_TIME.PLANS,
  });

  // Helper function for limit queries
  const createLimitQuery = useCallback((limitType: 'gyms' | 'clients' | 'users') => ({
    queryKey: queryKeys.limits(organization?.id || '', limitType),
    queryFn: () => organization?.id 
      ? sdk.subscriptions.checkSubscriptionLimit(organization.id, limitType)
      : Promise.resolve(null),
    enabled: !!organization?.id,
    staleTime: QUERY_STALE_TIME.LIMITS,
  }), [organization?.id, queryKeys, sdk.subscriptions]);

  // Query to fetch usage limits
  const { data: gymLimits } = useQuery(createLimitQuery('gyms'));
  const { data: clientLimits } = useQuery(createLimitQuery('clients'));
  const { data: userLimits } = useQuery(createLimitQuery('users'));

  // Handle plan selection with proper error handling and cache invalidation
  const handleSelectPlan = useCallback(async (planId: string) => {
    if (!organization?.id) {
      Alert.alert('Error', 'No se encontró la organización');
      return;
    }

    // Check if this plan is already active
    if (subscription?.subscriptionPlanId === planId) {
      Alert.alert('Información', 'Este plan ya está activo');
      return;
    }
    // try {
    //   await execute(
    //     () => sdk.subscriptions.affiliateOrganization(organization.id, {
    //       subscriptionPlanId: planId,
    //     })(),
    //     {
    //       action: 'Actualizando plan de suscripción...',
    //       successMessage: 'Plan actualizado exitosamente',
    //       errorFormatter: (error: any) => 
    //         `Error al actualizar el plan: ${error?.message || 'Error desconocido'}`,
    //       successActions: {
    //         onSuccess: () => {
    //           // Invalidate related queries after successful plan change
    //           queryClient.invalidateQueries({ queryKey: ['subscription-limits'] });
    //           queryClient.invalidateQueries({ queryKey: ['session'] });
    //         },
    //       },
    //     }
    //   );
    // } catch (error) {
    //   console.error('Plan selection error:', error);
    // }
  }, [organization?.id, subscription?.subscriptionPlanId, execute, sdk.subscriptions, queryClient]);

  // Memoized utility functions
  const formatPlanPrice = useCallback((price: any): string => {
    if (typeof price === 'object' && price !== null) {
      // Handle multi-currency pricing with nested currency objects
      const currency = organization?.currency || 'USD';
      
      // Check if price has the expected structure: { COP: { currency: "COP", value: 0 } }
      if (price[currency] && typeof price[currency] === 'object') {
        const priceValue = price[currency].value;
        return priceValue === 0 ? 'Gratis' : formatPrice(priceValue);
      }
      
      // Legacy format: direct value { COP: 0 }
      if (price[currency] !== undefined) {
        return price[currency] === 0 ? 'Gratis' : formatPrice(price[currency]);
      }
      
      // Fallback to first available price
      const firstCurrency = Object.keys(price)[0];
      if (firstCurrency && price[firstCurrency] !== undefined) {
        if (typeof price[firstCurrency] === 'object' && price[firstCurrency].value !== undefined) {
          const priceValue = price[firstCurrency].value;
          return priceValue === 0 ? 'Gratis' : formatPrice(priceValue);
        }
        return price[firstCurrency] === 0 ? 'Gratis' : formatPrice(price[firstCurrency]);
      }
      return 'Gratis';
    }
    if (typeof price === 'number') {
      return price === 0 ? 'Gratis' : formatPrice(price);
    }
    return 'Gratis';
  }, [organization?.currency, formatPrice]);

  const getUsagePercentage = useCallback((current: number, limit: number): number => {
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  }, []);

  const getUsageColor = useCallback((percentage: number): string => {
    if (percentage >= USAGE_THRESHOLDS.HIGH) return 'text-red-600';
    if (percentage >= USAGE_THRESHOLDS.MEDIUM) return 'text-yellow-600';
    return 'text-green-600';
  }, []);

  const formatDate = useCallback((dateString: string | Date): string => {
    const dateObj = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const isCurrentPlan = useCallback((planId: string): boolean => {
    return subscription?.subscriptionPlanId === planId;
  }, [subscription?.subscriptionPlanId]);

  // Loading and error states - memoized for performance
  const loadingState = useMemo(() => {
    if (!isLoading) return null;
    
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Cargando planes...</Text>
      </View>
    );
  }, [isLoading]);

  const errorState = useMemo(() => {
    if (!error) return null;
    
    return (
      <View className="flex-1 justify-center items-center bg-background p-4">
        <Text className="text-red-600 text-center text-lg font-semibold">
          Error al cargar los planes de suscripción
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          Por favor, intenta nuevamente más tarde
        </Text>
        <Button 
          variant="outline" 
          className="mt-4"
          onPress={() => queryClient.invalidateQueries({ queryKey: queryKeys.plans })}
        >
          <ButtonText>Reintentar</ButtonText>
        </Button>
      </View>
    );
  }, [error, queryClient, queryKeys.plans]);

  if (loadingState) return loadingState;
  if (errorState) return errorState;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Current Subscription Info */}
        {subscription && (
          <Card className="mb-6 border-primary">
            <View className="p-4">
              <VStack className="gap-4">
                <HStack className="justify-between items-start">
                  <VStack className="flex-1">
                    <Text className="text-xl font-semibold text-foreground">
                      {subscription.subscriptionPlan?.name || 'Plan no disponible'}
                    </Text>
                    <HStack className="items-center gap-2 mt-1">
                      <Badge action={subscription.status === 'active' ? 'success' : 'muted'}>
                        <BadgeText>
                          {subscription.status === 'active' ? 'Activo' : subscription.status}
                        </BadgeText>
                      </Badge>
                      {subscription.endDate && (
                        <HStack className="items-center gap-1">
                          <Clock size={14} className="text-muted-foreground" />
                          <Text className="text-sm text-muted-foreground">
                            Hasta {formatDate(subscription.endDate)}
                          </Text>
                        </HStack>
                      )}
                    </HStack>
                  </VStack>
                  <Text className="text-2xl font-bold text-primary">
                    {formatPlanPrice(subscription.subscriptionPlan?.price)}
                  </Text>
                </HStack>

                {/* Usage Statistics */}
                <VStack className="gap-3 mt-4">
                  <Text className="font-semibold text-base">Uso del Plan</Text>
                  
                  {/* Gyms Usage */}
                  {gymLimits && (
                    <UsageMeter
                      icon={Building2}
                      label="Gimnasios"
                      current={gymLimits.currentUsage}
                      limit={gymLimits.limit}
                      iconColor="text-blue-600"
                      getUsagePercentage={getUsagePercentage}
                      getUsageColor={getUsageColor}
                    />
                  )}

                  {/* Clients Usage */}
                  {clientLimits && (
                    <UsageMeter
                      icon={Users}
                      label="Clientes"
                      current={clientLimits.currentUsage}
                      limit={clientLimits.limit}
                      iconColor="text-green-600"
                      getUsagePercentage={getUsagePercentage}
                      getUsageColor={getUsageColor}
                    />
                  )}

                  {/* Users Usage */}
                  {userLimits && (
                    <UsageMeter
                      icon={UserCheck}
                      label="Usuarios"
                      current={userLimits.currentUsage}
                      limit={userLimits.limit}
                      iconColor="text-purple-600"
                      getUsagePercentage={getUsagePercentage}
                      getUsageColor={getUsageColor}
                    />
                  )}
                </VStack>
              </VStack>
            </View>
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
                <View className="p-4">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">{plan.name}</Text>
                      {plan.description && (
                        <Text className="mt-1 text-sm text-muted-foreground">
                          {plan.description}
                        </Text>
                      )}
                    </View>
                    <Text className="text-lg font-semibold text-primary">
                      {formatPlanPrice(plan.price)}
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
                                  {key === 'prioritySupport' ? 'Soporte Prioritario' : key.replace(/_/g, ' ')}
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
                    <PlanActionButton
                      isCurrentPlan={isCurrentPlan(plan.id)}
                      onSelectPlan={() => handleSelectPlan(plan.id)}
                    />
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <View className="p-4">
                <Text className="text-sm text-muted-foreground">
                  No hay planes disponibles en este momento
                </Text>
              </View>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}