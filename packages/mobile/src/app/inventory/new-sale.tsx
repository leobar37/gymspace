import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';

export default function NewSaleScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        <VStack space="md" className="p-4">
          <Text className="text-center text-gray-600 text-lg">
            Nueva Venta
          </Text>
          <Text className="text-center text-gray-500">
            Esta pantalla mostrará el proceso de nueva venta con carrito
          </Text>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}