import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Button, ButtonText } from '@/components/ui/button';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Icon } from '@/components/ui/icon';
import { Box } from '@/components/ui/box';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicatorWrapper,
  ActionsheetDragIndicator,
  ActionsheetItem,
  ActionsheetItemText,
} from '@/components/ui/actionsheet';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Heading } from '@/components/ui/heading';
import {
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  DollarSignIcon,
} from 'lucide-react-native';
import { usePlansController } from '@/features/plans';
import { Toast, ToastTitle, ToastDescription, useToast } from '@/components/ui/toast';
import { useFormatPrice } from '@/config/ConfigContext';

const PlanDetailSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <VStack className="gap-2">
    <Text className="text-sm font-medium text-gray-500 uppercase">{title}</Text>
    {children}
  </VStack>
);

const StatCard: React.FC<{
  icon: any;
  value: string | number;
  label: string;
  color?: string;
}> = ({ icon, value, label, color = 'text-gray-600' }) => {
  // Handle NaN and invalid numbers
  const displayValue = (() => {
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        return '0';
      }
      return value.toString();
    }
    return value || '0';
  })();

  return (
    <Card className="flex-1 p-4">
      <VStack className="items-center gap-2">
        <Icon as={icon} className={`w-6 h-6 ${color}`} />
        <Text className="text-2xl font-bold text-gray-900">{displayValue}</Text>
        <Text className="text-xs text-gray-500">{label}</Text>
      </VStack>
    </Card>
  );
};

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams();
  const planId = typeof id === 'string' ? id : '';
  const formatPrice = useFormatPrice();
  const { usePlanDetail, usePlanStats, updatePlan, deletePlan } = usePlansController();
  const toast = useToast();

  const [showActionsheet, setShowActionsheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: plan, isLoading: isPlanLoading, error: planError } = usePlanDetail(planId);
  const { data: stats } = usePlanStats(planId);

  const isActive = plan?.status === 'active';

  const handleEdit = () => {
    setShowActionsheet(false);
    router.push(`/plans/${planId}/edit`);
  };

  const handleToggleStatus = () => {
    setShowActionsheet(false);

    if (!plan) return;

    const newStatus = isActive ? 'inactive' : 'active';
    const action = isActive ? 'desactivar' : 'activar';

    Alert.alert(
      `¿${action.charAt(0).toUpperCase() + action.slice(1)} plan?`,
      `¿Estás seguro de que deseas ${action} este plan?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            updatePlan.mutate(
              { id: planId, data: { status: newStatus } },
              {
                onSuccess: () => {
                  toast.show({
                    placement: 'top',
                    duration: 3000,
                    render: ({ id }) => {
                      return (
                        <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                          <ToastTitle>Plan {action}do</ToastTitle>
                          <ToastDescription>El plan se {action}ó correctamente</ToastDescription>
                        </Toast>
                      );
                    },
                  });
                },
                onError: (error: any) => {
                  toast.show({
                    placement: 'top',
                    duration: 4000,
                    render: ({ id }) => {
                      return (
                        <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                          <ToastTitle>Error al {action}</ToastTitle>
                          <ToastDescription>
                            {error instanceof Error
                              ? error.message
                              : `No se pudo ${action} el plan`}
                          </ToastDescription>
                        </Toast>
                      );
                    },
                  });
                },
              },
            );
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    setShowActionsheet(false);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deletePlan(planId, {
      onSuccess: () => {
        toast.show({
          placement: 'top',
          duration: 3000,
          render: ({ id }) => {
            return (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Plan eliminado</ToastTitle>
                <ToastDescription>El plan se eliminó correctamente</ToastDescription>
              </Toast>
            );
          },
        });
        router.replace('/plans');
      },
      onError: (error) => {
        toast.show({
          placement: 'top',
          duration: 4000,
          render: ({ id }) => {
            return (
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Error al eliminar</ToastTitle>
                <ToastDescription>
                  {error instanceof Error ? error.message : 'No se pudo eliminar el plan'}
                </ToastDescription>
              </Toast>
            );
          },
        });
      },
    });
    setShowDeleteDialog(false);
  };

  if (isPlanLoading) {
    return (
      <Box className="flex-1 items-center justify-center">
        <Spinner size="large" />
      </Box>
    );
  }

  if (planError || !plan) {
    return (
      <Box className="flex-1 items-center justify-center p-4">
        <Text className="text-red-500 text-center">Error al cargar el plan</Text>
        <Button onPress={() => router.back()} className="mt-4">
          <ButtonText>Volver</ButtonText>
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button variant="link" onPress={() => setShowActionsheet(true)} size="sm">
              <Icon as={MoreVerticalIcon} className="text-gray-600" />
            </Button>
          ),
        }}
      />

      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView className="flex-1">
          <VStack className="px-4 pb-4 gap-4">
            {/* Header */}
            <Card className="p-4">
              <VStack className="gap-3">
                <HStack className="justify-between items-start">
                  <VStack className="flex-1 gap-1">
                    <Text className="text-2xl font-bold text-gray-900">{plan.name}</Text>
                    {plan.description && (
                      <Text className="text-sm text-gray-600">{plan.description}</Text>
                    )}
                  </VStack>
                  <Badge action={isActive ? 'success' : 'muted'} size="md">
                    <BadgeText>{isActive ? 'Activo' : 'Inactivo'}</BadgeText>
                  </Badge>
                </HStack>

                <HStack className="gap-4">
                  <VStack>
                    <Text className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.basePrice)}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      por{' '}
                      {plan.durationDays
                        ? `${plan.durationDays} ${plan.durationDays === 1 ? 'día' : 'días'}`
                        : `${plan.durationMonths} ${plan.durationMonths === 1 ? 'mes' : 'meses'}`}
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </Card>

            {/* Stats */}
            {stats && (
              <VStack className="gap-3">
                <Text className="text-sm font-medium text-gray-500 uppercase px-1">
                  Estadísticas
                </Text>
                <HStack className="gap-3">
                  <StatCard
                    icon={UsersIcon}
                    value={isNaN(stats.activeContracts) ? 0 : stats.activeContracts}
                    label="Contratos activos"
                    color="text-green-600"
                  />
                  <StatCard
                    icon={DollarSignIcon}
                    value={formatPrice(isNaN(stats.monthlyRevenue) ? 0 : stats.monthlyRevenue)}
                    label="Ingresos mensuales"
                    color="text-blue-600"
                  />
                </HStack>
              </VStack>
            )}

            {/* Features */}
            {plan.features && plan.features.length > 0 && (
              <Card className="p-4">
                <PlanDetailSection title="Características incluidas">
                  <VStack className="gap-2">
                    {plan.features.map((feature, index) => (
                      <HStack key={index} className="gap-2">
                        <Icon as={CheckCircleIcon} className="text-green-600 w-5 h-5" />
                        <Text className="text-gray-700 flex-1">{feature}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </PlanDetailSection>
              </Card>
            )}

            {/* Additional Info */}
            <Card className="p-4">
              <VStack className="gap-4">
                <PlanDetailSection title="Información adicional">
                  <VStack className="gap-3">
                    <HStack className="justify-between">
                      <Text className="text-gray-600">Evaluaciones incluidas</Text>
                      <Text className="font-medium text-gray-900">{plan.maxEvaluations || 0}</Text>
                    </HStack>

                    <HStack className="justify-between">
                      <Text className="text-gray-600">Incluye asesor</Text>
                      <Icon
                        as={plan.includesAdvisor ? CheckCircleIcon : XCircleIcon}
                        className={`w-5 h-5 ${
                          plan.includesAdvisor ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                    </HStack>

                    <HStack className="justify-between">
                      <Text className="text-gray-600">Precio personalizado</Text>
                      <Icon
                        as={plan.allowsCustomPricing ? CheckCircleIcon : XCircleIcon}
                        className={`w-5 h-5 ${
                          plan.allowsCustomPricing ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                    </HStack>

                    <HStack className="justify-between">
                      <Text className="text-gray-600">Visible en catálogo</Text>
                      <Icon
                        as={plan.showInCatalog ? CheckCircleIcon : XCircleIcon}
                        className={`w-5 h-5 ${
                          plan.showInCatalog ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                    </HStack>
                  </VStack>
                </PlanDetailSection>
              </VStack>
            </Card>

            {/* Terms and Conditions */}
            {plan.termsAndConditions && (
              <Card className="p-4">
                <PlanDetailSection title="Términos y condiciones">
                  <Text className="text-gray-700">{plan.termsAndConditions}</Text>
                </PlanDetailSection>
              </Card>
            )}

            {/* Action Button */}
            <Button
              onPress={handleToggleStatus}
              variant={isActive ? 'outline' : 'solid'}
              className="mt-2"
            >
              <ButtonText className={isActive ? 'text-red-600' : ''}>
                {isActive ? 'Desactivar plan' : 'Activar plan'}
              </ButtonText>
            </Button>
          </VStack>
        </ScrollView>

        {/* Action Sheet */}
        <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)}>
          <ActionsheetBackdrop />
          <ActionsheetContent>
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            <ActionsheetItem onPress={handleEdit}>
              <Icon as={EditIcon} className="text-gray-600 mr-3" />
              <ActionsheetItemText>Editar plan</ActionsheetItemText>
            </ActionsheetItem>
            <ActionsheetItem onPress={handleToggleStatus}>
              <Icon as={isActive ? XCircleIcon : CheckCircleIcon} className="text-gray-600 mr-3" />
              <ActionsheetItemText>
                {isActive ? 'Desactivar plan' : 'Activar plan'}
              </ActionsheetItemText>
            </ActionsheetItem>
            <ActionsheetItem onPress={handleDelete}>
              <Icon as={TrashIcon} className="text-red-600 mr-3" />
              <ActionsheetItemText className="text-red-600">Eliminar plan</ActionsheetItemText>
            </ActionsheetItem>
          </ActionsheetContent>
        </Actionsheet>

        {/* Delete Confirmation Dialog */}
        <AlertDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <Heading size="lg">Eliminar plan</Heading>
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text>
                ¿Estás seguro de que deseas eliminar este plan? Esta acción no se puede deshacer.
                {stats && stats.activeContracts > 0 && (
                  <Text className="text-red-600 mt-2">
                    Advertencia: Este plan tiene {stats.activeContracts} contratos activos.
                  </Text>
                )}
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button variant="outline" onPress={() => setShowDeleteDialog(false)} className="mr-3">
                <ButtonText>Cancelar</ButtonText>
              </Button>
              <Button
                onPress={confirmDelete}
                className="bg-red-600"
                disabled={stats && stats.activeContracts > 0}
              >
                <ButtonText>Eliminar</ButtonText>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SafeAreaView>
    </>
  );
}
