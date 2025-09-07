import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { ButtonText, Button as GluestackButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useOnboardingStore } from '@/store/onboarding';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  UserIcon,
  XCircleIcon,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, View } from 'react-native';

export default function InvitationValidationScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { setInvitationToken, setInvitationData } = useOnboardingStore();
  const [invitationToken, setLocalInvitationToken] = useState(token || '');

  // Validate invitation query
  const {
    data: invitationInfo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invitation', invitationToken],
    queryFn: async () => {
      // TODO: Implement actual API call to validate invitation
      // Mock invitation data for now
      return {
        valid: true,
        invitation: {
          id: 'inv-123',
          gymName: 'Fitness Center Pro',
          gymLogo: 'https://example.com/logo.png',
          gymAddress: 'Av. Principal 123, Lima',
          inviterName: 'Juan Pérez',
          inviterRole: 'Administrador',
          role: 'Entrenador',
          permissions: ['Gestión de clientes', 'Control de asistencia', 'Reportes'],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          email: 'nuevo@ejemplo.com',
        },
      };
    },
    enabled: !!invitationToken && invitationToken.length > 0,
  });

  useEffect(() => {
    if (invitationInfo?.valid && invitationInfo.invitation) {
      setInvitationToken(invitationToken);
      setInvitationData(invitationInfo.invitation);
    }
  }, [invitationInfo]);

  const handleAcceptInvitation = () => {
    router.push('/(onboarding)/collaborator/complete-registration');
  };

  const handleManualTokenEntry = () => {
    // TODO: Implement manual token entry modal
  };

  if (!invitationToken) {
    // Manual token entry screen
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 px-6 py-4">
          {/* Header */}
          <Pressable onPress={() => router.back()} className="mb-8">
            <Icon as={ChevronLeftIcon} className="text-gray-700 w-8 h-8" />
          </Pressable>

          <VStack className="flex-1 gap-12">
            <VStack className="items-center gap-4">
              <Heading className="text-gray-900 text-center text-2xl font-bold">
                Ingresa tu código de invitación
              </Heading>
              <Text className="text-gray-600 text-lg text-center">
                Ingresa el código que recibiste por correo electrónico
              </Text>
            </VStack>

            {/* Token input */}
            <VStack className="gap-6">
              {/* TODO: Add token input field */}
              <Card className="p-6 border-2 border-gray-200">
                <Text className="text-center text-gray-600">Campo de entrada de código aquí</Text>
              </Card>
            </VStack>

            <Box className="mt-auto">
              <GluestackButton onPress={handleManualTokenEntry} className="w-full py-3 px-6">
                <ButtonText>Validar invitación</ButtonText>
              </GluestackButton>
            </Box>
          </VStack>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <Center className="flex-1">
          <ActivityIndicator color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Validando invitación...</Text>
        </Center>
      </SafeAreaView>
    );
  }

  if (error || !invitationInfo?.valid) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 px-6 py-4">
          <Pressable onPress={() => router.back()} className="mb-8">
            <Icon as={ChevronLeftIcon} className="text-gray-700 w-8 h-8" />
          </Pressable>

          <Center className="flex-1">
            <VStack className="items-center gap-6">
              <Center className="w-20 h-20 bg-red-100 rounded-full">
                <Icon as={XCircleIcon} className="text-red-600 w-12 h-12" />
              </Center>
              <VStack className="items-center gap-2">
                <Heading className="text-gray-900 text-xl font-bold">Invitación inválida</Heading>
                <Text className="text-gray-600 text-center">
                  El código de invitación es inválido o ha expirado
                </Text>
              </VStack>
              <GluestackButton onPress={() => router.back()} variant="outline">
                <ButtonText>Volver</ButtonText>
              </GluestackButton>
            </VStack>
          </Center>
        </View>
      </SafeAreaView>
    );
  }

  const { invitation } = invitationInfo;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 py-4">
        {/* Header */}
        <Pressable onPress={() => router.back()} className="mb-8">
          <Icon as={ChevronLeftIcon} className="text-gray-700 w-8 h-8" />
        </Pressable>

        <VStack className="flex-1 gap-12">
          {/* Gym info */}
          <Card className="p-6 bg-blue-50 border border-blue-200">
            <VStack className="gap-6">
              <HStack className="items-center gap-4">
                <Avatar className="w-12 h-12">
                  {invitation.gymLogo ? (
                    <AvatarImage source={{ uri: invitation.gymLogo }} />
                  ) : (
                    <AvatarFallbackText>{invitation.gymName.substring(0, 2)}</AvatarFallbackText>
                  )}
                </Avatar>
                <VStack className="flex-1 gap-1">
                  <Text className="font-semibold text-lg text-gray-900">{invitation.gymName}</Text>
                  <HStack className="items-center gap-1">
                    <Icon as={BuildingIcon} className="text-gray-500 w-3 h-3" />
                    <Text className="text-gray-600 text-sm">{invitation.gymAddress}</Text>
                  </HStack>
                </VStack>
              </HStack>
            </VStack>
          </Card>

          {/* Invitation details */}
          <VStack className="gap-8">
            <VStack className="gap-4">
              <Heading className="text-gray-900 text-xl font-bold">Has sido invitado</Heading>
              <Text className="text-gray-600 text-lg">
                {invitation.inviterName} te ha invitado a unirte como {invitation.role}
              </Text>
            </VStack>

            {/* Invitation info */}
            <VStack className="gap-6">
              <HStack className="items-center gap-4">
                <Icon as={UserIcon} className="text-gray-500 w-6 h-6" />
                <VStack className="flex-1 gap-1">
                  <Text className="text-gray-500 text-sm">Invitado por</Text>
                  <Text className="font-medium text-gray-900">
                    {invitation.inviterName} ({invitation.inviterRole})
                  </Text>
                </VStack>
              </HStack>

              <HStack className="items-center gap-4">
                <Icon as={CalendarIcon} className="text-gray-500 w-6 h-6" />
                <VStack className="flex-1 gap-1">
                  <Text className="text-gray-500 text-sm">Válido hasta</Text>
                  <Text className="font-medium text-gray-900">
                    {new Date(invitation.expiresAt).toLocaleDateString('es-PE')}
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            {/* Permissions */}
            <VStack className="gap-4">
              <Text className="font-medium text-gray-900">Permisos asignados:</Text>
              <VStack className="gap-2">
                {invitation.permissions.map((permission, index) => (
                  <HStack key={index} className="items-center gap-2">
                    <Icon as={CheckIcon} className="text-green-500 w-4 h-4" />
                    <Text className="text-gray-700">{permission}</Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </VStack>

          {/* Action buttons */}
          <Box className="mt-auto">
            <VStack className="gap-4">
              <GluestackButton onPress={handleAcceptInvitation} className="w-full py-3 px-6">
                <ButtonText>Aceptar invitación</ButtonText>
              </GluestackButton>
              <GluestackButton
                onPress={() => router.back()}
                variant="outline"
                className="w-full py-3 px-6"
              >
                <ButtonText>Rechazar</ButtonText>
              </GluestackButton>
            </VStack>
          </Box>
        </VStack>
      </View>
    </SafeAreaView>
  );
}
