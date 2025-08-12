import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { ChevronLeftIcon } from 'lucide-react-native';
import { router } from 'expo-router';

export default function LowStockScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" >
      <ScrollView>
        <VStack space="md" className="p-4">
          {/* Header with Back Button */}
          <HStack className="items-center mb-2">
            <Pressable
              onPress={() => router.back()}
              className="p-2 -ml-2 rounded-lg"
            >
              <Icon as={ChevronLeftIcon} className="w-6 h-6 text-gray-700" />
            </Pressable>
            <Text className="text-xl font-bold text-gray-900 ml-2">
              Productos con Stock Bajo
            </Text>
          </HStack>
          <Text className="text-center text-gray-600 text-lg">
            Gestión de Inventario
          </Text>
          <Text className="text-center text-gray-500">
            Esta pantalla mostrará productos que necesitan reposición
          </Text>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}