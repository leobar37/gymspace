import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { InfoIcon } from 'lucide-react-native';
import { BackButton } from '@/shared/components';

export default function EditContractScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Editar Contrato',
          headerBackTitle: '',
          headerLeft: () => <BackButton />,
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <Box className="flex-1 bg-gray-50 p-4">
          <Card>
            <VStack className="p-6 items-center" space="lg">
              <Box className="w-20 h-20 bg-yellow-100 rounded-full items-center justify-center">
                <Icon as={InfoIcon} className="w-10 h-10 text-yellow-600" />
              </Box>

              <VStack space="sm" className="items-center">
                <Text className="text-lg font-semibold text-gray-900 text-center">
                  Los contratos no se pueden editar
                </Text>
                <Text className="text-gray-600 text-center">
                  Una vez creado un contrato, no es posible modificar sus términos. Si necesitas
                  hacer cambios, debes anular el contrato actual y crear uno nuevo.
                </Text>
              </VStack>

              <VStack space="sm" className="w-full">
                <Button
                  variant="solid"
                  onPress={() => router.replace(`../contracts/${id}`)}
                  className="w-full"
                >
                  <ButtonText>Ver Contrato</ButtonText>
                </Button>

                <Button variant="outline" onPress={() => router.back()} className="w-full">
                  <ButtonText>Volver</ButtonText>
                </Button>
              </VStack>
            </VStack>
          </Card>
        </Box>
      </SafeAreaView>
    </>
  );
}
