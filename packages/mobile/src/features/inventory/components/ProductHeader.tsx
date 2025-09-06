import React from 'react';
import { Pressable } from 'react-native';
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
    <HStack className="justify-between items-center">
      <Pressable
        onPress={() => router.back()}
        className="p-2"
      >
        <Icon as={ChevronLeftIcon} className="w-6 h-6 text-gray-700" />
      </Pressable>

      <HStack space="md" className="items-center">
        <Pressable
          onPress={onEdit}
          className="p-2"
        >
          <Icon as={EditIcon} className="w-5 h-5 text-gray-700" />
        </Pressable>

        <Pressable
          onPress={onDelete}
          className="p-2"
        >
          <Icon as={TrashIcon} className="w-5 h-5 text-red-600" />
        </Pressable>
      </HStack>
    </HStack>
  );
};