import React, { useState, useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Input, InputField, InputIcon } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Button, ButtonText } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Fab, FabIcon } from '@/components/ui/fab';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText
} from '@/components/ui/actionsheet';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogFooter
} from '@/components/ui/alert-dialog';
import { Heading } from '@/components/ui/heading';
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, XIcon } from 'lucide-react-native';
import { usePlansController, SearchFilters } from '../controllers/plans.controller';
import { MembershipPlan } from '@gymspace/sdk';
import { Toast, ToastTitle, ToastDescription, useToast } from '@/components/ui/toast';
import { useFormatPrice } from '@/config/ConfigContext';

interface PlanItemProps {
  plan: MembershipPlan;
  onPress: () => void;
  onDelete: (planId: string) => void;
}

const PlanItem: React.FC<PlanItemProps> = ({ plan, onPress, onDelete }) => {
  const formatPrice = useFormatPrice();
  const isActive = plan.status === 'active';
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleLongPress = () => {
    setShowActionSheet(true);
  };

  const handleEdit = () => {
    setShowActionSheet(false);
    router.push(`/plans/${plan.id}/edit`);
  };

  const handleDeletePress = () => {
    setShowActionSheet(false);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete(plan.id);
  };

  return (
    <>
      <Pressable onPress={onPress} onLongPress={handleLongPress}>
        <Card className="mx-4 mb-3">
          <VStack className="p-4 gap-2">
            <HStack className="justify-between items-center">
              <Text className="text-lg font-semibold text-gray-900">{plan.name}</Text>
              <Badge action={isActive ? 'success' : 'muted'} size="sm">
                <BadgeText>{isActive ? 'Activo' : 'Inactivo'}</BadgeText>
              </Badge>
            </HStack>

            {plan.description && (
              <Text className="text-sm text-gray-600 line-clamp-2">{plan.description}</Text>
            )}

            <HStack className="gap-4 mt-1">
              <VStack>
                <Text className="text-2xl font-bold text-gray-900">
                  {formatPrice(plan.basePrice)}
                </Text>
                <Text className="text-xs text-gray-500">
                  por {plan.durationDays
                    ? `${plan.durationDays} ${plan.durationDays === 1 ? 'día' : 'días'}`
                    : `${plan.durationMonths} ${plan.durationMonths === 1 ? 'mes' : 'meses'}`
                  }
                </Text>
              </VStack>

              {/* TODO: Add contract count when available from API */}
            </HStack>

            {plan.features && plan.features.length > 0 && (
              <HStack className="gap-2 mt-2 flex-wrap">
                {plan.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} action="muted" size="sm">
                    <BadgeText>{feature}</BadgeText>
                  </Badge>
                ))}
                {plan.features.length > 3 && (
                  <Badge action="muted" size="sm">
                    <BadgeText>+{plan.features.length - 3}</BadgeText>
                  </Badge>
                )}
              </HStack>
            )}
          </VStack>
        </Card>
      </Pressable>

      <Actionsheet isOpen={showActionSheet} onClose={() => setShowActionSheet(false)}>
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetItem onPress={handleEdit}>
            <Icon as={EditIcon} className="mr-2" />
            <ActionsheetItemText>Editar plan</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={handleDeletePress}>
            <Icon as={TrashIcon} className="mr-2 text-red-500" />
            <ActionsheetItemText className="text-red-500">Eliminar plan</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>

      <AlertDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading>Confirmar eliminación</Heading>
            <AlertDialogCloseButton>
              <Icon as={XIcon} className="text-gray-500" />
            </AlertDialogCloseButton>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>
              ¿Estás seguro que deseas eliminar el plan "{plan.name}"? Esta acción no se puede deshacer.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="outline" onPress={() => setShowDeleteDialog(false)}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button action="negative" onPress={handleConfirmDelete} className="ml-3">
              <ButtonText>Eliminar</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const EmptyState: React.FC = () => (
  <VStack className="flex-1 items-center justify-center p-8">
    <Text className="text-gray-500 text-center mb-4">
      No tienes planes de membresía creados
    </Text>
    <Button onPress={() => router.push('/plans/create')}>
      <ButtonText>Crear primer plan</ButtonText>
    </Button>
  </VStack>
);

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <VStack className="flex-1 items-center justify-center p-8">
    <Text className="text-red-500 text-center mb-4">
      Error al cargar los planes
    </Text>
    <Button onPress={onRetry}>
      <ButtonText>Reintentar</ButtonText>
    </Button>
  </VStack>
);

export const PlansList: React.FC = () => {
  const { usePlansList, deletePlan } = usePlansController();
  const [search, setSearch] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const toast = useToast();

  const filters: SearchFilters = {
    activeOnly: showActiveOnly,
  };

  const { data, isLoading, error, refetch } = usePlansList(filters);

  // Filter plans locally by search term
  const filteredPlans = React.useMemo(() => {
    if (!data) return [];
    if (!search) return data;

    const searchLower = search.toLowerCase();
    return data.filter(plan =>
      plan.name.toLowerCase().includes(searchLower) ||
      (plan.description && plan.description.toLowerCase().includes(searchLower))
    );
  }, [data, search]);

  const handlePlanPress = useCallback((plan: MembershipPlan) => {
    router.push(`/plans/${plan.id}`);
  }, []);

  const handleDeletePlan = useCallback((planId: string) => {
    deletePlan(planId, {
      onSuccess: () => {
        toast.show({
          placement: 'top',
          duration: 3000,
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Plan eliminado</ToastTitle>
              <ToastDescription>
                El plan ha sido eliminado correctamente
              </ToastDescription>
            </Toast>
          ),
        });
      },
      onError: () => {
        toast.show({
          placement: 'top',
          duration: 4000,
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>
                No se pudo eliminar el plan
              </ToastDescription>
            </Toast>
          ),
        });
      },
    });
  }, [deletePlan, toast]);

  const renderPlanItem = useCallback(({ item }: { item: MembershipPlan }) => (
    <PlanItem
      plan={item}
      onPress={() => handlePlanPress(item)}
      onDelete={handleDeletePlan}
    />
  ), [handlePlanPress, handleDeletePlan]);

  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center">
        <Spinner size="large" />
      </Box>
    );
  }

  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <VStack className="p-4 bg-white border-b border-gray-200">
        <Input className="mb-3">
          <InputIcon>
            <Icon as={SearchIcon} className="text-black" />
          </InputIcon>
          <InputField
            placeholder="Buscar planes..."
            value={search}
            onChangeText={setSearch}
          />
        </Input>

        <HStack className="items-center justify-between">
          <Text className="text-sm text-gray-600">Mostrar solo activos</Text>
          <Switch
            size="sm"
            value={showActiveOnly}
            onValueChange={setShowActiveOnly}
          />
        </HStack>
      </VStack>

      <FlatList
        data={filteredPlans}
        renderItem={renderPlanItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={<EmptyState />}
        refreshing={false}
        onRefresh={refetch}
      />

      {filteredPlans.length > 0 && (
        <Fab
          onPress={() => router.push('/plans/create')}
          className='size-16'
        >
          <FabIcon as={PlusIcon} />
        </Fab>
      )}
    </View>
  );
};