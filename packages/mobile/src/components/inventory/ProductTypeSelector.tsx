import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetIcon,
  ActionsheetItem,
  ActionsheetItemText,
} from '@/components/ui/actionsheet';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { PackageIcon, WrenchIcon } from 'lucide-react-native';
import React from 'react';

interface ProductTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'product' | 'service') => void;
}

interface ProductTypeOption {
  id: 'product' | 'service';
  title: string;
  description: string;
  icon: any;
}

const productTypeOptions: ProductTypeOption[] = [
  {
    id: 'product',
    title: 'Producto',
    description: 'Artículos físicos que vendes en tu gimnasio como bebidas, suplementos o accesorios',
    icon: PackageIcon,
  },
  {
    id: 'service',
    title: 'Servicio',
    description: 'Servicios adicionales como entrenamiento personal, evaluaciones o clases especiales',
    icon: WrenchIcon,
  },
];

export function ProductTypeSelector({ isOpen, onClose, onSelectType }: ProductTypeSelectorProps) {
  const handleSelectType = (type: 'product' | 'service') => {
    onSelectType(type);
    onClose();
  };

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="max-h-96">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        
        <VStack space="md" className="w-full pb-4">
          <Text className="text-lg font-semibold text-center text-gray-900">
            ¿Qué quieres crear?
          </Text>
          
          <VStack space="xs">
            {productTypeOptions.map((option) => (
              <ActionsheetItem
                key={option.id}
                onPress={() => handleSelectType(option.id)}
                className="flex-col items-start py-4"
              >
                <View className="flex-row items-start w-full">
                  <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-3">
                    <ActionsheetIcon 
                      as={option.icon} 
                      className="text-blue-600" 
                      size="md"
                    />
                  </View>
                  <VStack className="flex-1" space="xs">
                    <ActionsheetItemText className="font-medium text-gray-900">
                      {option.title}
                    </ActionsheetItemText>
                    <Text className="text-sm text-gray-600 leading-5">
                      {option.description}
                    </Text>
                  </VStack>
                </View>
              </ActionsheetItem>
            ))}
          </VStack>
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}