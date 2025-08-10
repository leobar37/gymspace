import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView, View } from 'react-native';
import { CreateContractForm } from '@/features/contracts/components/CreateContractForm';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ArrowLeft } from 'lucide-react-native';

export default function CreateContractScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nuevo Contrato',
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={{ flex: 1 }}>
          {/* Custom Header */}
          <HStack className="p-4 items-center border-b border-gray-200">
            <Pressable
              onPress={handleBack}
              className="flex-row items-center"
            >
              <Icon as={ArrowLeft} size="md" className="text-gray-700 mr-2" />
              <Text className="text-base text-blue-600">Contratos</Text>
            </Pressable>
            <View className="flex-1 items-center mr-12">
              <Text className="text-lg font-semibold">Nuevo Contrato</Text>
            </View>
          </HStack>
          
          {/* Form Content */}
          <CreateContractForm />
        </View>
      </SafeAreaView>
    </>
  );
}