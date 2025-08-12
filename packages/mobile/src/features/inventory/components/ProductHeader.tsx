import React from 'react';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { EditIcon, TrashIcon } from 'lucide-react-native';

interface ProductHeaderProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({ 
  onEdit, 
  onDelete 
}) => {
  return (
    <HStack className="justify-end" space="sm">
      <Button
        size="sm"
        onPress={onEdit}
        className="bg-blue-600"
      >
        <Icon as={EditIcon} className="w-4 h-4 text-white mr-1" />
        <ButtonText className="text-white">Editar</ButtonText>
      </Button>

      <Button
        size="sm"
        onPress={onDelete}
        className="bg-red-600"
      >
        <Icon as={TrashIcon} className="w-4 h-4 text-white mr-1" />
        <ButtonText className="text-white">Eliminar</ButtonText>
      </Button>
    </HStack>
  );
};