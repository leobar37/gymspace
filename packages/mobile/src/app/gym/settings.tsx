import React, { useEffect } from 'react';
import { ScrollView, RefreshControl, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSwitch } from '@/components/forms/FormSwitch';
import { useUpdateCurrentGym, useGymStats } from '@/features/gyms/controllers/gyms.controller';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { Spinner } from '@/components/ui/spinner';
import { UpdateGymDto } from '@gymspace/sdk';
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { Icon } from '@/components/ui/icon';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users,
  Settings,
  ChevronRight,
  ChevronLeft
} from 'lucide-react-native';

// Validation schema
const gymSettingsSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  capacity: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : Number(val),
    z.number().min(1, 'La capacidad debe ser mayor a 0').optional()
  ),
  amenities: z.object({
    hasParking: z.boolean().optional(),
    hasShowers: z.boolean().optional(),
    hasLockers: z.boolean().optional(),
  }).optional(),
});

type GymSettingsFormData = z.infer<typeof gymSettingsSchema>;

export default function GymSettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { gym: currentGym, isLoading, error, refetchSession } = useCurrentSession();
  const { data: gymStats } = useGymStats(currentGym?.id);
  const updateGym = useUpdateCurrentGym();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<GymSettingsFormData>({
    resolver: zodResolver(gymSettingsSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      phone: '',
      email: '',
      openingTime: '',
      closingTime: '',
      capacity: '',
      amenities: {
        hasParking: false,
        hasShowers: false,
        hasLockers: false,
      },
    },
  });

  // Load current gym data into form
  useEffect(() => {
    if (currentGym) {
      reset({
        name: currentGym.name || '',
        address: currentGym.address || '',
        city: currentGym.city || '',
        state: currentGym.state || '',
        postalCode: currentGym.postalCode || '',
        phone: currentGym.phone || '',
        email: currentGym.email || '',
        openingTime: currentGym.openingTime || '',
        closingTime: currentGym.closingTime || '',
        capacity: currentGym.capacity?.toString() || '',
        amenities: {
          hasParking: currentGym.amenities?.hasParking || false,
          hasShowers: currentGym.amenities?.hasShowers || false,
          hasLockers: currentGym.amenities?.hasLockers || false,
        },
      });
    }
  }, [currentGym, reset]);

  const onSubmit = async (data: GymSettingsFormData) => {
    try {
      const updateData: UpdateGymDto = {
        ...data,
        capacity: data.capacity ? Number(data.capacity) : undefined,
      };
      
      await updateGym.mutateAsync(updateData);
      
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} variant="solid" action="success">
            <VStack space="xs">
              <ToastTitle>Éxito</ToastTitle>
              <ToastDescription>
                Configuración del gimnasio actualizada exitosamente
              </ToastDescription>
            </VStack>
          </Toast>
        ),
      });
    } catch (error) {
      console.error('Error updating gym:', error);
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} variant="solid" action="error">
            <VStack space="xs">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>
                No se pudo actualizar la configuración del gimnasio
              </ToastDescription>
            </VStack>
          </Toast>
        ),
      });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Spinner size="large" />
        <Text className="mt-4 text-gray-600">Cargando información...</Text>
      </View>
    );
  }

  if (error || !currentGym) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <VStack space="lg" className="items-center">
          <Icon as={Building2} size={48} className="text-gray-400" />
          <Text className="text-lg text-center text-gray-700">
            No se pudo cargar la información del gimnasio
          </Text>
          <Button onPress={() => refetchSession()}>
            <ButtonText>Reintentar</ButtonText>
          </Button>
        </VStack>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Configuración del Gimnasio',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2">
              <Icon as={ChevronLeft} className="w-6 h-6 text-gray-700" />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetchSession()} />
        }
        showsVerticalScrollIndicator={false}
      >
        <VStack className="p-4 pb-8" space="md">
          {/* Gym Stats Card */}
          {gymStats && (
            <Card className="p-4 bg-white rounded-xl shadow-sm">
              <VStack space="md">
                <HStack className="items-center justify-between">
                  <Text className="text-lg font-semibold text-gray-900">
                    Estadísticas del Gimnasio
                  </Text>
                  <Icon as={Building2} size={20} className="text-gray-500" />
                </HStack>
                
                <VStack space="md">
                  <HStack space="md">
                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm text-gray-500">Clientes Totales</Text>
                      <Text className="text-xl font-bold text-gray-900">
                        {gymStats.totalClients}
                      </Text>
                    </VStack>
                    
                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm text-gray-500">Clientes Activos</Text>
                      <Text className="text-xl font-bold text-green-600">
                        {gymStats.activeClients}
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <HStack space="md">
                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm text-gray-500">Contratos Activos</Text>
                      <Text className="text-xl font-bold text-blue-600">
                        {gymStats.activeContracts}
                      </Text>
                    </VStack>
                    
                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm text-gray-500">Check-ins Hoy</Text>
                      <Text className="text-xl font-bold text-purple-600">
                        {gymStats.checkInsToday}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </VStack>
            </Card>
          )}

          {/* Basic Information Section */}
          <Card className="p-4 bg-white rounded-xl shadow-sm">
            <VStack space="lg">
              <HStack className="items-center justify-between mb-2">
                <HStack className="items-center" space="sm">
                  <Icon as={Settings} size={20} className="text-gray-500" />
                  <Text className="text-lg font-semibold text-gray-900">
                    Información Básica
                  </Text>
                </HStack>
              </HStack>

              <FormInput
                control={control}
                name="name"
                label="Nombre del Gimnasio"
                placeholder="Ej: PowerFit Downtown"
              />

              <FormTextarea
                control={control}
                name="address"
                label="Dirección"
                placeholder="Calle y número"
                numberOfLines={2}
              />

              <HStack space="md">
                <View className="flex-1">
                  <FormInput
                    control={control}
                    name="city"
                    label="Ciudad"
                    placeholder="Ej: Lima"
                  />
                </View>

                <View className="flex-1">
                  <FormInput
                    control={control}
                    name="state"
                    label="Estado/Provincia"
                    placeholder="Ej: Lima"
                  />
                </View>
              </HStack>

              <FormInput
                control={control}
                name="postalCode"
                label="Código Postal"
                placeholder="Ej: 15001"
                keyboardType="numeric"
              />
            </VStack>
          </Card>

          {/* Contact Information Section */}
          <Card className="p-4 bg-white rounded-xl shadow-sm">
            <VStack space="lg">
              <HStack className="items-center" space="sm">
                <Icon as={Phone} size={20} className="text-gray-500" />
                <Text className="text-lg font-semibold text-gray-900">
                  Información de Contacto
                </Text>
              </HStack>

              <FormInput
                control={control}
                name="phone"
                label="Teléfono"
                placeholder="+51 999 999 999"
                keyboardType="phone-pad"
              />

              <FormInput
                control={control}
                name="email"
                label="Email"
                placeholder="info@gimnasio.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </VStack>
          </Card>

          {/* Schedule Section */}
          <Card className="p-4 bg-white rounded-xl shadow-sm">
            <VStack space="lg">
              <HStack className="items-center" space="sm">
                <Icon as={Clock} size={20} className="text-gray-500" />
                <Text className="text-lg font-semibold text-gray-900">
                  Horario de Atención
                </Text>
              </HStack>

              <HStack space="md">
                <View className="flex-1">
                  <FormInput
                    control={control}
                    name="openingTime"
                    label="Hora de Apertura"
                    placeholder="08:00"
                  />
                </View>

                <View className="flex-1">
                  <FormInput
                    control={control}
                    name="closingTime"
                    label="Hora de Cierre"
                    placeholder="22:00"
                  />
                </View>
              </HStack>

              <FormInput
                control={control}
                name="capacity"
                label="Capacidad Máxima"
                placeholder="Ej: 150"
                keyboardType="numeric"
                description="Número máximo de personas permitidas"
              />
            </VStack>
          </Card>

          {/* Amenities Section */}
          <Card className="p-4 bg-white rounded-xl shadow-sm">
            <VStack space="lg">
              <HStack className="items-center" space="sm">
                <Icon as={Users} size={20} className="text-gray-500" />
                <Text className="text-lg font-semibold text-gray-900">
                  Comodidades
                </Text>
              </HStack>

              <FormSwitch
                control={control}
                name="amenities.hasParking"
                label="Estacionamiento"
                description="El gimnasio cuenta con estacionamiento propio"
              />

              <FormSwitch
                control={control}
                name="amenities.hasShowers"
                label="Duchas"
                description="Duchas disponibles para los clientes"
              />

              <FormSwitch
                control={control}
                name="amenities.hasLockers"
                label="Casilleros"
                description="Casilleros para guardar pertenencias"
              />
            </VStack>
          </Card>

          {/* Save Button */}
          <Button
            size="lg"
            className="bg-blue-600 mt-4"
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || updateGym.isPending}
          >
            <ButtonText>
              {updateGym.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </>
  );
}