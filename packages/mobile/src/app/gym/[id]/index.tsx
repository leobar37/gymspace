import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLocalSearchParams, router } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Globe, 
  Edit3,
  Facebook,
  Instagram,
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
        return Facebook;
      case 'instagram':
        return Instagram;
      case 'whatsapp':
        return MessageCircle;
      default:
        return Globe;
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Spinner size="lg" />
      </View>
    );
  }

  if (!gym) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-center">No se encontró el gimnasio</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 space-y-4">
        {/* Basic Information Section */}
        <Card className="p-4">
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-lg font-semibold">Información Básica</Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.push(`/gym/${id}/edit-basic`)}
            >
              <Edit3 size={16} className="text-gray-600" />
            </Button>
          </View>
          
          <View className="space-y-3">
            <View className="flex-row items-start">
              <View className="w-8">
                <Text className="text-2xl">🏢</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500">Nombre</Text>
                <Text className="text-base">{gym.name}</Text>
              </View>
            </View>

            {gym.phone && (
              <View className="flex-row items-start">
                <View className="w-8">
                  <Phone size={20} className="text-gray-500" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Teléfono</Text>
                  <Text className="text-base">{gym.phone}</Text>
                </View>
              </View>
            )}

            {gym.email && (
              <View className="flex-row items-start">
                <View className="w-8">
                  <Mail size={20} className="text-gray-500" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Email</Text>
                  <Text className="text-base">{gym.email}</Text>
                </View>
              </View>
            )}

            {gym.address && (
              <View className="flex-row items-start">
                <View className="w-8">
                  <MapPin size={20} className="text-gray-500" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Dirección</Text>
                  <Text className="text-base">{gym.address}</Text>
                </View>
              </View>
            )}

            {gym.capacity && (
              <View className="flex-row items-start">
                <View className="w-8">
                  <Users size={20} className="text-gray-500" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Capacidad</Text>
                  <Text className="text-base">{gym.capacity} personas</Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Schedule Section */}
        <Card className="p-4">
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-lg font-semibold">Horario</Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.push(`/gym/${id}/edit-schedule`)}
            >
              <Edit3 size={16} className="text-gray-600" />
            </Button>
          </View>

          <View className="space-y-2">
            {['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map((day, index) => {
              const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index];
              const schedule = gym.schedule?.[dayKey as keyof typeof gym.schedule];
              
              return (
                <View key={day} className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm capitalize">{day}</Text>
                  <Text className="text-sm text-gray-600">
                    {formatScheduleDay(schedule)}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Social Media Section */}
        <Card className="p-4">
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-lg font-semibold">Redes Sociales</Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.push(`/gym/${id}/edit-social`)}
            >
              <Edit3 size={16} className="text-gray-600" />
            </Button>
          </View>

          <View className="space-y-3">
            {gym.socialMedia ? (
              Object.entries(gym.socialMedia)
                .filter(([_, value]) => value)
                .map(([platform, value]) => {
                  const Icon = getSocialMediaIcon(platform);
                  return (
                    <View key={platform} className="flex-row items-center">
                      <View className="w-8">
                        <Icon size={20} className="text-gray-500" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 capitalize">{platform}</Text>
                        <Text className="text-sm">{value as string}</Text>
                      </View>
                    </View>
                  );
                })
            ) : (
              <Text className="text-sm text-gray-500">No hay redes sociales configuradas</Text>
            )}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}