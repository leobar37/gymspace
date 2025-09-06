import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from '@/components/ui/actionsheet';
import { Icon } from '@/components/ui/icon';
import { EditIcon, TrashIcon } from 'lucide-react-native';
import React from 'react';

interface ClientActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

export const ClientActionSheet: React.FC<ClientActionSheetProps> = ({
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  return (
    <Actionsheet isOpen={isOpen} onClose={onClose} snapPoints={[30]}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <ActionsheetItem onPress={onEdit}>
          <Icon as={EditIcon} className="w-4 h-4 text-gray-500 mr-3" />
          <ActionsheetItemText>Editar</ActionsheetItemText>
        </ActionsheetItem>

        <ActionsheetItem onPress={onToggleStatus}>
          <Icon as={TrashIcon} className="w-4 h-4 text-red-500 mr-3" />
          <ActionsheetItemText className="text-red-500">Eliminar</ActionsheetItemText>
        </ActionsheetItem>
      </ActionsheetContent>
    </Actionsheet>
  );
};