import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Building2Icon, UserPlusIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, SafeAreaView, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Logo } from '@/components/Logo';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

export default function UserTypeSelectionScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <VStack className="flex-1 px-6">
        {/* Top Section - Logo and Welcome */}
        <VStack className="flex-1 items-center">
          {/* Logo */}
          <VStack className="items-center gap-3 mt-12 mb-6">
            <View className="p-4 bg-white rounded-2xl shadow-sm">
              <Logo variant="sm" width={64} height={60} />
            </View>
            <Text className="text-2xl font-bold text-gray-900 tracking-tight">GYMSPACE</Text>
          </VStack>

          {/* Welcome text */}
          <VStack className="items-center gap-3 mb-10">
            <Heading className="text-center text-gray-900 text-3xl font-bold">
              Bienvenido a GymSpace
            </Heading>
            <Text className="text-center text-gray-600 text-lg font-medium">
              ¿Cómo quieres empezar?
            </Text>
          </VStack>

          {/* Action cards */}
          <VStack className="w-full gap-5">
            {/* Owner option */}
            <Card className="p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md active:border-blue-400">
              <Pressable onPress={() => {
                console.log("hello world");
                router.push('owner/step-1-personal');
              }} className="active:scale-95">
                <VStack className="gap-4 items-center">
                  <View className="w-20 h-20 bg-blue-100 rounded-2xl items-center justify-center">
                    <Icon as={Building2Icon} className="text-blue-600 w-9 h-9" />
                  </View>
                  <VStack className="gap-2 items-center">
                    <Text className="font-bold text-xl text-gray-900">
                      Soy Dueño de Gimnasio
                    </Text>
                    <Text className="text-gray-600 text-base text-center leading-relaxed px-4">
                      Quiero registrar mi gimnasio y comenzar a usar GymSpace
                    </Text>
                  </VStack>
                </VStack>
              </Pressable>
            </Card>

            {/* Collaborator option */}
            <Card className="p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md active:border-green-400">
              <Pressable
                onPress={() => router.push('/collaborator/invitation')}
                className="active:scale-95"
              >
                <VStack className="gap-4 items-center">
                  <View className="w-20 h-20 bg-green-100 rounded-2xl items-center justify-center">
                    <Icon as={UserPlusIcon} className="text-green-600 w-9 h-9" />
                  </View>
                  <VStack className="gap-2 items-center">
                    <Text className="font-bold text-xl text-gray-900">
                      Tengo una Invitación
                    </Text>
                    <Text className="text-gray-600 text-base text-center leading-relaxed px-4">
                      Me han invitado a colaborar en un gimnasio existente
                    </Text>
                  </VStack>
                </VStack>
              </Pressable>
            </Card>
        </VStack>
      </VStack>

      {/* Bottom Section - Footer */}
      <Center className="pb-12 pt-6">
        <View className="bg-white rounded-full px-6 py-3 shadow-sm border border-gray-100">
          <HStack className="gap-1.5 items-center">
            <Text className="text-gray-700 text-base">
              ¿Ya tienes cuenta?
            </Text>
            <Link href="/login" asChild>
              <Pressable className="active:opacity-70">
                <Text className="text-blue-600 font-bold text-base">
                  Iniciar sesión
                </Text>
              </Pressable>
            </Link>
          </HStack>
        </View>
      </Center>
    </VStack>
    </SafeAreaView >
  );
}