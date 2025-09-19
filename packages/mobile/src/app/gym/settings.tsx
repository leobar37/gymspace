import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { useGymStats, useUpdateCurrentGym } from '@/features/gyms/controllers/gyms.controller';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { UpdateGymDto } from '@gymspace/sdk';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import { Building, Building2, ChevronLeft, ChevronRight, Settings } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, RefreshControl, ScrollView } from 'react-native';
import { z } from 'zod';

// Validation schema
const gymSettingsSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type GymSettingsFormData = z.infer<typeof gymSettingsSchema>;

export default function GymSettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { gym: currentGym, isLoading, error, refetchSession, isOwner } = useCurrentSession();
  const { data: gymStats } = useGymStats(currentGym?.id);
  const updateGym = useUpdateCurrentGym();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<GymSettingsFormData>({
    resolver: zodResolver(gymSettingsSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
    },
  });

  // Load current gym data into form
  useEffect(() => {
    if (currentGym) {
      reset({
        name: currentGym.name || '',
        address: currentGym.address || '',
        phone: currentGym.phone || '',
      });
    }
  }, [currentGym, reset]);

  const onSubmit = async (data: GymSettingsFormData) => {
    try {
      const updateData: UpdateGymDto = {
        name: data.name,
        address: data.address,
        phone: data.phone,
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
          <Icon as={Building2} size="xl" className="text-gray-400" />
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
                  <Icon as={Building2} size="sm" className="text-gray-500" />
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

          {/* Organization Management Section - Only for Owners */}
          {isOwner && (
            <Card className="p-4 bg-white rounded-xl shadow-sm">
              <VStack space="md">
                <HStack className="items-center justify-between">
                  <HStack className="items-center" space="sm">
                    <Icon as={Building} size="sm" className="text-gray-500" />
                    <Text className="text-lg font-semibold text-gray-900">
                      Gestión de Organización
                    </Text>
                  </HStack>
                </HStack>

                <Text className="text-sm text-gray-600">
                  Administra tu organización y todos los gimnasios asociados
                </Text>

                <Pressable
                  onPress={() => router.push('/gym/organization')}
                  className="flex-row items-center justify-between py-3 px-2 rounded-lg bg-gray-50 active:bg-gray-100"
                >
                  <HStack className="items-center flex-1" space="sm">
                    <Icon as={Building2} size="sm" className="text-blue-600" />
                    <VStack className="flex-1">
                      <Text className="text-base font-medium text-gray-900">Ver Organización</Text>
                      <Text className="text-sm text-gray-500">Resumen y gimnasios</Text>
                    </VStack>
                  </HStack>
                  <Icon as={ChevronRight} size="sm" className="text-gray-400" />
                </Pressable>
              </VStack>
            </Card>
          )}

          {/* Basic Information Section */}
          <Card className="p-4 bg-white rounded-xl shadow-sm">
            <VStack space="lg">
              <HStack className="items-center justify-between mb-2">
                <HStack className="items-center" space="sm">
                  <Icon as={Settings} size="sm" className="text-gray-500" />
                  <Text className="text-lg font-semibold text-gray-900">Información Básica</Text>
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

              <FormInput
                control={control}
                name="phone"
                label="Teléfono"
                placeholder="+51 999 999 999"
                keyboardType="phone-pad"
              />
            </VStack>
          </Card>

          {/* Save Button */}
          <Button
            size="lg"
            variant="solid"
            className="mt-4"
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || updateGym.isPending}
          >
            <ButtonText>{updateGym.isPending ? 'Guardando...' : 'Guardar Cambios'}</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </>
  );
}
