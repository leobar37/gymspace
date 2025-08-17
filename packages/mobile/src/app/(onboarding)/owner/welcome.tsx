import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { router } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button as GluestackButton, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Box } from '@/components/ui/box';
import { StatusBar } from 'expo-status-bar';
import { CheckCircleIcon } from 'lucide-react-native';
import { useOnboardingStore } from '@/store/onboarding';

export default function WelcomeScreen() {
  const { organizationData, resetOnboarding } = useOnboardingStore();

  const handleComplete = () => {
    // Reset onboarding state and navigate directly to dashboard
    resetOnboarding();
    router.replace('/(app)');
  };

  // Display organization name as gym name
  const displayGymName = organizationData?.name || 'tu gimnasio';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 py-8 mt-28">
        <VStack className="flex-1 gap-8">
          {/* Success animation */}
          <Center>
            <Center className="w-24 h-24 bg-green-100 rounded-full mb-4">
              <Icon as={CheckCircleIcon} className="text-green-600 w-12 h-12" />
            </Center>
          </Center>

          {/* Welcome message */}
          <VStack className="items-center gap-3">
            <Heading className="text-gray-900 text-center text-4xl font-bold">
              ¡Bienvenido a GymSpace!
            </Heading>
            <Text className="text-gray-600 text-lg text-center">
              Tu gimnasio "{displayGymName}" ha sido creado exitosamente
            </Text>
          </VStack>

          {/* Checklist */}
          {/* <VStack className="gap-4">
            <Text className="font-semibold text-gray-900 text-lg">
              Próximos pasos
            </Text>
            <VStack className="gap-3">
              {CHECKLIST_ITEMS.map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleChecklistAction(item.action)}
                >
                  <Card className="p-4 border border-gray-200">
                    <HStack className="items-center gap-3">
                      <Center className="w-10 h-10 bg-blue-100 rounded-full">
                        <Icon as={item.icon} className="text-blue-600 w-5 h-5" />
                      </Center>
                      <VStack className="flex-1 gap-1">
                        <Text className="font-medium text-gray-900">
                          {item.title}
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {item.description}
                        </Text>
                      </VStack>
                      <Icon as={ChevronRightIcon} className="text-gray-400 w-5 h-5" />
                    </HStack>
                  </Card>
                </Pressable>
              ))}
            </VStack>
          </VStack> */}

          {/* Complete button */}
          <Box className="mt-auto">
            <GluestackButton
              onPress={handleComplete}
            >
              <ButtonText>Comenzar</ButtonText>
            </GluestackButton>
          </Box>
        </VStack>
      </View>
    </SafeAreaView>
  );
}