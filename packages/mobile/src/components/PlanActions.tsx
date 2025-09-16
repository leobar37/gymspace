import React, { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/ui/icon';
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
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Toast, ToastTitle, ToastDescription, useToast } from '@/components/ui/toast';
import {
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react-native';

interface PlanActionsProps {
  planId: string;
  planName: string;
  isActive: boolean;
  activeContracts: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlan: (data: { id: string; data: { status: string } }) => void;
  onDeletePlan: (planId: string) => void;
}

export const PlanActions: React.FC<PlanActionsProps> = ({
  planId,
  planName,
  isActive,
  activeContracts,
  isOpen,
  onClose,
  onUpdatePlan,
  onDeletePlan,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const toast = useToast();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleEdit = useCallback(() => {
    handleClose();
    router.push(`/plans/${planId}/edit`);
  }, [planId, handleClose]);

  const handleToggleStatus = useCallback(() => {
    handleClose();

    const newStatus = isActive ? 'inactive' : 'active';
    const action = isActive ? 'desactivar' : 'activar';

    Alert.alert(
      `¿${action.charAt(0).toUpperCase() + action.slice(1)} plan?`,
      `¿Estás seguro de que deseas ${action} el plan "${planName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            onUpdatePlan({ id: planId, data: { status: newStatus } });
          },
        },
      ],
    );
  }, [planId, planName, isActive, handleClose, onUpdatePlan]);

  const handleDelete = useCallback(() => {
    handleClose();
    setShowDeleteDialog(true);
  }, [handleClose]);

  const confirmDelete = useCallback(() => {
    setShowDeleteDialog(false);
    onDeletePlan(planId);
  }, [planId, onDeletePlan]);

  const handleDeleteDialogClose = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);

  return (
    <>
      {/* Action Sheet */}
      <Actionsheet isOpen={isOpen} onClose={handleClose}>
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
      <AlertDialog isOpen={showDeleteDialog} onClose={handleDeleteDialogClose}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="lg">Eliminar plan</Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>
              ¿Estás seguro de que deseas eliminar el plan "{planName}"? Esta acción no se puede deshacer.
              {activeContracts > 0 && (
                <Text className="text-red-600 mt-2">
                  {'\n'}Advertencia: Este plan tiene {activeContracts} contratos activos.
                </Text>
              )}
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="outline" onPress={handleDeleteDialogClose} className="mr-3">
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              onPress={confirmDelete}
              className="bg-red-600"
              disabled={activeContracts > 0}
            >
              <ButtonText>Eliminar</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};