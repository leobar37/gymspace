import React from 'react';
import { ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { useLocalSearchParams, router } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Globe, 
  Edit3,
  MessageCircle
} from 'lucide-react-native';
import { useGym } from '@/features/gyms/controllers/gyms.controller';

export default function GymDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: gym, isLoading } = useGym(id);

  const formatScheduleDay = (daySchedule: any) => {
    if (!daySchedule || !daySchedule.isOpen) return 'Cerrado';
    if (daySchedule.slots && daySchedule.slots.length > 0) {
      return daySchedule.slots
        .map((slot: any) => `${slot.open} - ${slot.close}`)
        .join(', ');
    }
    return 'Horario no definido';
  };

  const getSocialMediaIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
      case 'instagram':
      case 'twitter':
      case 'linkedin':
        return Globe; // Using Globe for all social media platforms
      case 'whatsapp':
        return MessageCircle;
      default:
        return Globe;
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
    <ScrollView className="flex-1 bg-background-50">
      <VStack space="lg" className="p-4">
        {/* Basic Information Section */}
        <Card variant="elevated" size="md">
          <VStack space="md">
            <HStack className="justify-between items-start">
              <Text size="lg" className="font-semibold text-typography-900">
                Información Básica
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => router.push(`/gym/${id}/edit-basic`)}
                className="p-1"
              >
                <Edit3 size={16} className="text-typography-500" />
              </Button>
            </HStack>
            
            <VStack space="md">
              <HStack space="sm" className="items-start">
                <Box className="w-8 justify-center items-center">
                  <Text className="text-2xl">🏢</Text>
                </Box>
                <VStack space="xs" className="flex-1">
                  <Text size="xs" className="text-typography-500">
                    Nombre
                  </Text>
                  <Text size="sm" className="text-typography-900">
                    {gym.name}
                  </Text>
                </VStack>
              </HStack>

              {gym.phone && (
                <HStack space="sm" className="items-start">
                  <Box className="w-8 justify-center items-center">
                    <Phone size={20} className="text-typography-500" />
                  </Box>
                  <VStack space="xs" className="flex-1">
                    <Text size="xs" className="text-typography-500">
                      Teléfono
                    </Text>
                    <Text size="sm" className="text-typography-900">
                      {gym.phone}
                    </Text>
                  </VStack>
                </HStack>
              )}

              {gym.email && (
                <HStack space="sm" className="items-start">
                  <Box className="w-8 justify-center items-center">
                    <Mail size={20} className="text-typography-500" />
                  </Box>
                  <VStack space="xs" className="flex-1">
                    <Text size="xs" className="text-typography-500">
                      Email
                    </Text>
                    <Text size="sm" className="text-typography-900">
                      {gym.email}
                    </Text>
                  </VStack>
                </HStack>
              )}

              {gym.address && (
                <HStack space="sm" className="items-start">
                  <Box className="w-8 justify-center items-center">
                    <MapPin size={20} className="text-typography-500" />
                  </Box>
                  <VStack space="xs" className="flex-1">
                    <Text size="xs" className="text-typography-500">
                      Dirección
                    </Text>
                    <Text size="sm" className="text-typography-900">
                      {gym.address}
                    </Text>
                  </VStack>
                </HStack>
              )}

              {gym.capacity && (
                <HStack space="sm" className="items-start">
                  <Box className="w-8 justify-center items-center">
                    <Users size={20} className="text-typography-500" />
                  </Box>
                  <VStack space="xs" className="flex-1">
                    <Text size="xs" className="text-typography-500">
                      Capacidad
                    </Text>
                    <Text size="sm" className="text-typography-900">
                      {gym.capacity} personas
                    </Text>
                  </VStack>
                </HStack>
              )}
            </VStack>
          </VStack>
        </Card>

        {/* Schedule Section */}
        <Card variant="elevated" size="md">
          <VStack space="md">
            <HStack className="justify-between items-start">
              <Text size="lg" className="font-semibold text-typography-900">
                Horario
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => router.push(`/gym/${id}/edit-schedule`)}
                className="p-1"
              >
                <Edit3 size={16} className="text-typography-500" />
              </Button>
            </HStack>

            <VStack space="xs">
              {['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map((day, index) => {
                const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index];
                const schedule = gym.schedule?.[dayKey as keyof typeof gym.schedule];
                
                return (
                  <HStack key={day} className="justify-between items-center py-3 border-b border-outline-100">
                    <Text size="sm" className="capitalize text-typography-900 font-medium">
                      {day}
                    </Text>
                    <Text size="sm" className="text-typography-600">
                      {formatScheduleDay(schedule)}
                    </Text>
                  </HStack>
                );
              })}
            </VStack>
          </VStack>
        </Card>

        {/* Social Media Section */}
        <Card variant="elevated" size="md">
          <VStack space="md">
            <HStack className="justify-between items-start">
              <Text size="lg" className="font-semibold text-typography-900">
                Redes Sociales
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => router.push(`/gym/${id}/edit-social`)}
                className="p-1"
              >
                <Edit3 size={16} className="text-typography-500" />
              </Button>
            </HStack>

            <VStack space="md">
              {gym.socialMedia && Object.entries(gym.socialMedia).filter(([_, value]) => value).length > 0 ? (
                <>
                  {Object.entries(gym.socialMedia)
                    .filter(([_, value]) => value)
                    .map(([platform, value]) => {
                      const Icon = getSocialMediaIcon(platform);
                      return (
                        <HStack key={platform} space="sm" className="items-start">
                          <Box className="w-8 justify-center items-center">
                            <Icon size={20} className="text-typography-500" />
                          </Box>
                          <VStack space="xs" className="flex-1">
                            <Text size="xs" className="text-typography-500 capitalize">
                              {platform}
                            </Text>
                            <Text size="sm" className="text-typography-900">
                              {value as string}
                            </Text>
                          </VStack>
                        </HStack>
                      );
                    })}
                </>
              ) : (
                <Box className="py-4 items-center">
                  <Text size="sm" className="text-typography-500 text-center">
                    No hay redes sociales configuradas
                  </Text>
                </Box>
              )}
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
}