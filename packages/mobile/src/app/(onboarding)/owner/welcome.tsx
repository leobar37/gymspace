import React from 'react';
import { SafeAreaView, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { 
  VStack, 
  HStack,
  Center,
  Heading, 
  Text, 
  GluestackButton as Button, 
  ButtonText,
  Icon,
  Card,
  Box
} from '@/components/ui';
import { StatusBar } from 'expo-status-bar';
import { CheckCircleIcon, RocketIcon, BookOpenIcon, HeadphonesIcon, ChevronRightIcon } from 'lucide-react-native';
import { useOnboardingStore } from '@/store/onboarding';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useMutation } from '@tanstack/react-query';

// Welcome checklist items
const CHECKLIST_ITEMS = [
  {
    icon: BookOpenIcon,
    title: 'Ver el tutorial',
    description: 'Aprende a usar todas las funciones',
    action: 'tutorial',
  },
  {
    icon: HeadphonesIcon,
    title: 'Configurar notificaciones',
    description: 'Mantente al día con tu gimnasio',
    action: 'notifications',
  },
  {
    icon: RocketIcon,
    title: 'Invitar colaboradores',
    description: 'Agrega a tu equipo de trabajo',
    action: 'invite',
  },
];

export default function WelcomeScreen() {
  const { 
    ownerData, 
    organizationData, 
    selectedPlanId, 
    gymData,
    resetOnboarding 
  } = useOnboardingStore();
  const { sdk, setAuthToken } = useGymSdk();

  // Complete registration mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement actual API call to complete registration
      // This would combine all the onboarding data and create the complete account
      console.log('Completing registration with:', {
        ownerData,
        organizationData,
        selectedPlanId,
        gymData,
      });
      
      // Mock successful registration
      return {
        success: true,
        accessToken: 'mock-token',
        userId: 'mock-user-id',
      };
    },
    onSuccess: async (data) => {
      // Store auth token
      await setAuthToken(data.accessToken);
      
      // Reset onboarding state
      resetOnboarding();
      
      // Navigate to main app
      router.replace('/(app)');
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
    },
  });

  const handleChecklistAction = (action: string) => {
    // Handle different checklist actions
    switch (action) {
      case 'tutorial':
        // Navigate to tutorial
        break;
      case 'notifications':
        // Navigate to notification settings
        break;
      case 'invite':
        // Navigate to invite screen
        break;
    }
  };

  const handleComplete = () => {
    completeMutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 py-8">
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
              Tu gimnasio "{gymData?.name}" ha sido creado exitosamente
            </Text>
          </VStack>

          {/* Checklist */}
          <VStack className="gap-4">
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
          </VStack>

          {/* Complete button */}
          <Box className="mt-auto">
            <Button
              onPress={handleComplete}
              disabled={completeMutation.isPending}
              className="py-3 px-6 w-full"
            >
              <ButtonText>
                {completeMutation.isPending ? 'Finalizando...' : 'Comenzar a usar GymSpace'}
              </ButtonText>
            </Button>
          </Box>
        </VStack>
      </View>
    </SafeAreaView>
  );
}