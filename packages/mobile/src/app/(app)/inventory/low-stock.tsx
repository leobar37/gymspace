import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';

export default function LowStockScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView>
        <VStack space="md" className="p-4">
          <Text className="text-center text-gray-600 text-lg">
            Productos con Stock Bajo
          </Text>
          <Text className="text-center text-gray-500">
            Esta pantalla mostrará productos que necesitan reposición
          </Text>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}