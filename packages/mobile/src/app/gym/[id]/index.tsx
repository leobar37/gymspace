import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { useLocalSearchParams, router } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { MapPin, Phone, Mail, Users, Globe, Edit3, MessageCircle } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useGym } from '@/features/gyms/controllers/gyms.controller';
import { WhatsAppIcon, InstagramIcon, FacebookIcon } from '@/components/icons';

export default function GymDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: gym, isLoading } = useGym(id);

  const formatScheduleDay = (daySchedule: any) => {
    if (!daySchedule || !daySchedule.isOpen) return 'Cerrado';
    if (daySchedule.slots && daySchedule.slots.length > 0) {
      return daySchedule.slots.map((slot: any) => `${slot.open} - ${slot.close}`).join(', ');
    }
    return 'Horario no definido';
  };

  const getSocialMediaIcon = (platform: string, size = 18) => {
    const getIconColor = (platform: string) => {
      switch (platform) {
        case 'facebook':
          return '#1877f2';
        case 'instagram':
          return '#E4405F';
        case 'whatsapp':
          return '#25D366';
        default:
          return '#6b7280';
      }
    };

    switch (platform) {
      case 'facebook':
        return <FacebookIcon size={size} color={getIconColor(platform)} />;
      case 'instagram':
        return <InstagramIcon size={size} color={getIconColor(platform)} />;
      case 'whatsapp':
        return <WhatsAppIcon size={size} color={getIconColor(platform)} />;
      default:
        return <Icon as={Globe} size="sm" className="text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  if (!gym) {
    return (
      <Box className="flex-1 justify-center items-center p-4">
        <Text className="text-center">No se encontró el gimnasio</Text>
      </Box>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <VStack space="lg" className="p-6">
        {/* Basic Information Section */}
        <Box className="bg-white rounded-xl p-6 shadow-sm">
          <HStack className="justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">Información Básica</Text>
            <Button
              variant="ghost"
              size="sm"
              className="text-white"
              onPress={() => router.push(`/gym/${id}/edit-basic`)}
            >
              <Icon as={Edit3} size="md" className="text-white" />
            </Button>
          </HStack>

          <VStack space="md" className="space-y-4">
            <VStack className="space-y-1">
              <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Nombre
              </Text>
              <Text className="text-base text-gray-900">{gym.name}</Text>
            </VStack>

            {gym.phone && (
              <VStack className="space-y-1">
                <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Teléfono
                </Text>
                <Text className="text-base text-gray-900">{gym.phone}</Text>
              </VStack>
            )}

            {gym.email && (
              <VStack className="space-y-1">
                <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Email
                </Text>
                <Text className="text-base text-gray-900">{gym.email}</Text>
              </VStack>
            )}

            {gym.address && (
              <VStack className="space-y-1">
                <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Dirección
                </Text>
                <Text className="text-base text-gray-900">{gym.address}</Text>
              </VStack>
            )}

            {gym.capacity && (
              <VStack className="space-y-1">
                <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Capacidad
                </Text>
                <Text className="text-base text-gray-900">{gym.capacity} personas</Text>
              </VStack>
            )}
          </VStack>
        </Box>

        {/* Schedule Section */}
        <Box className="bg-white rounded-xl p-6 shadow-sm">
          <HStack className="justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">Horario</Text>
            <Button
              variant="ghost"
              size="sm"
              className="text-white"
              onPress={() => router.push(`/gym/${id}/edit-schedule`)}
            >
              <Icon as={Edit3} size="md" className="text-white" />
            </Button>
          </HStack>

          <VStack className="space-y-3">
            {['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map(
              (day, index) => {
                const dayKey = [
                  'monday',
                  'tuesday',
                  'wednesday',
                  'thursday',
                  'friday',
                  'saturday',
                  'sunday',
                ][index];
                const schedule = gym.schedule?.[dayKey as keyof typeof gym.schedule];

                return (
                  <HStack
                    key={day}
                    className="justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <Text className="text-sm font-medium text-gray-900 capitalize">{day}</Text>
                    <Text className="text-sm text-gray-600">{formatScheduleDay(schedule)}</Text>
                  </HStack>
                );
              },
            )}
          </VStack>
        </Box>

        {/* Social Media Section */}
        <Box className="bg-white rounded-xl p-6 shadow-sm">
          <HStack className="justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">Redes Sociales</Text>
            <Button
              variant="ghost"
              size="sm"
              className="text-white"
              onPress={() => router.push(`/gym/${id}/edit-social`)}
            >
              <Icon as={Edit3} size="sm" />
            </Button>
          </HStack>

          {gym.socialMedia &&
          Object.entries(gym.socialMedia).filter(([_, value]) => value).length > 0 ? (
            <View className="gap-y-3">
              {Object.entries(gym.socialMedia)
                .filter(([_, value]) => value)
                .map(([platform, value]) => (
                  <VStack key={platform} className="space-y-2">
                    <HStack className="items-center space-x-2">
                      {getSocialMediaIcon(platform)}
                      <Text className="text-base text-gray-900 ml-6">{value as string}</Text>
                    </HStack>
                  </VStack>
                ))}
            </View>
          ) : (
            <Box className="py-8 items-center">
              <Text className="text-sm text-gray-500 text-center">
                No hay redes sociales configuradas
              </Text>
            </Box>
          )}
        </Box>
      </VStack>
    </ScrollView>
  );
}
