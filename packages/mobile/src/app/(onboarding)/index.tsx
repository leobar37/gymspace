import { Logo } from '@/components/Logo';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Building2Icon } from 'lucide-react-native';
import React from 'react';
import { Pressable, SafeAreaView, View } from 'react-native';

export default function UserTypeSelectionScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <VStack className="flex-1 px-6">
        {/* Logo Section - Fixed positioning */}
        <VStack className="items-center mt-44 pb-4">
          <View className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
            <Logo variant="sm" width={56} height={52} />
          </View>
        </VStack>

        {/* Welcome Section */}
        <VStack className="items-center gap-3 px-4 pb-0">
          <Heading className="text-center text-gray-900 text-3xl font-bold">
            Bienvenido a GymSpace
          </Heading>
          <Text className="text-center text-gray-600 text-base leading-relaxed">
            La plataforma completa para gestionar tu gimnasio
          </Text>
        </VStack>

        {/* Main Action Card */}
        <VStack className="flex-1 justify-center px-2">
          <Card className="p-6 bg-white border border-gray-200 shadow-lg rounded-2xl">
            <VStack className="gap-5 items-center">
              {/* Icon Container with proper white icon */}
              <View className="w-20 bg-gray-600 h-20 rounded-2xl items-center justify-center shadow-md">
                <Icon as={Building2Icon} className="w-10 h-10" />
              </View>
              
              <VStack className="gap-2 items-center">
                <Text className="font-bold text-xl text-gray-900 text-center">
                  Soy Dueño de Gimnasio
                </Text>
                <Text className="text-gray-600 text-sm text-center leading-relaxed px-4">
                  Registra tu gimnasio y comienza a gestionar tus clientes, planes y más
                </Text>
              </VStack>

              {/* Call-to-Action Button */}
              <Button 
                variant="solid" 
                size="lg" 
                className="w-full mt-3"
                onPress={() => {
                  console.log("hello world");
                  router.push('owner/step-1-personal');
                }}
              >
                <ButtonText>Comenzar Ahora</ButtonText>
              </Button>
            </VStack>
          </Card>
        </VStack>

        {/* Bottom Login Section */}
        <VStack className="pb-10 pt-6 gap-3 items-center">
          <Text className="text-gray-500 text-sm">
            ¿Ya tienes una cuenta?
          </Text>
          <Link href="/login" asChild>
            <Button variant="outline" size="md">
              <ButtonText>Iniciar Sesión</ButtonText>
            </Button>
          </Link>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
}