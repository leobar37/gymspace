import React from 'react';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { EditIcon, TrashIcon, ChevronLeftIcon } from 'lucide-react-native';
import { router } from 'expo-router';

interface ProductHeaderProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({ 
  onEdit, 
  onDelete 
}) => {
  return (
    <HStack className="justify-between" space="sm">
      <Button
        size="sm"
        variant="outline"
        onPress={() => router.back()}
      >
        <Icon as={ChevronLeftIcon} className="w-4 h-4 mr-1 text-gray-500" />
        <ButtonText>Volver</ButtonText>
      </Button>

      <HStack space="sm">
        <Button
          size="sm"
          variant="solid"
          onPress={onEdit}
        >
          <Icon as={EditIcon} className="w-4 h-4 mr-1" />
          <ButtonText>Editar</ButtonText>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onPress={onDelete}
        >
          <Icon as={TrashIcon} className="w-4 h-4 mr-1" />
          <ButtonText>Eliminar</ButtonText>
        </Button>
      </HStack>
    </HStack>
  );
};