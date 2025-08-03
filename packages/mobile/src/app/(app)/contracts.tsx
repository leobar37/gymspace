import React from 'react';
import { View } from 'react-native';
import { VStack, Text, Icon, Button, ButtonText } from '../../components/ui';
import { FileTextIcon } from 'lucide-react-native';

export default function ContractsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <VStack className="flex-1 items-center justify-center p-8">
        <Icon as={FileTextIcon} className="w-16 h-16 text-gray-400 mb-4" />
        <Text className="text-xl font-semibold text-gray-900 mb-2">
          Contratos
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          Gestiona los contratos y membresías de tus clientes
        </Text>
        <Button className="bg-blue-600">
          <ButtonText>Crear Contrato</ButtonText>
        </Button>
      </VStack>
    </View>
  );
}