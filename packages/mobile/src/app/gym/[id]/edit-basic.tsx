import React, { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useLocalSearchParams, router } from 'expo-router';
import { UpdateGymDto } from '@gymspace/sdk';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormInput } from '@/components/forms/FormInput';
import { useLoadingScreen } from '@/shared/loading-screen';
import { Spinner } from '@/components/ui/spinner';
import { useGym, useUpdateGym } from '@/features/gyms/controllers/gyms.controller';

const gymBasicInfoSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  capacity: z.number().optional(),
});

type GymBasicInfoData = z.infer<typeof gymBasicInfoSchema>;

export default function EditGymBasicInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { execute } = useLoadingScreen();
  const { data: gym, isLoading } = useGym(id);
  const updateGymMutation = useUpdateGym();

  const methods = useForm<GymBasicInfoData>({
    resolver: zodResolver(gymBasicInfoSchema),
  });

  useEffect(() => {
    if (gym) {
      // Set form default values when gym data is loaded
      methods.reset({
        name: gym.name,
        phone: gym.phone || '',
        email: gym.email || '',
        address: gym.address || '',
        capacity: gym.capacity || undefined,
      });
    }
  }, [gym, methods]);

  const onSubmit = async (data: GymBasicInfoData) => {
    const updatePromise = async () => {
      const updateData: UpdateGymDto = {
        name: data.name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        capacity: data.capacity || undefined,
      };

      await updateGymMutation.mutateAsync({ id, data: updateData });
      router.back();
    };

    await execute(updatePromise(), {
      action: 'Actualizando información del gimnasio...',
      successMessage: 'Información actualizada exitosamente',
      errorFormatter: (error: any) => error.message || 'Error al actualizar la información',
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Spinner size="large" />
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
    <FormProvider {...methods}>
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-6">
          {/* Form Fields Container */}
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <View className="space-y-6">
              <FormInput
                name="name"
                label="Nombre del Gimnasio"
                placeholder="Ingrese el nombre del gimnasio"
                autoCapitalize="words"
              />

              <FormInput
                name="phone"
                label="Teléfono de Contacto"
                placeholder="+1 234 567 8900"
                keyboardType="phone-pad"
              />

              <FormInput
                name="email"
                label="Email de Contacto"
                placeholder="contacto@gimnasio.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <FormInput
                name="address"
                label="Dirección"
                placeholder="Calle 123, Ciudad"
                multiline
                numberOfLines={3}
              />

              <FormInput
                name="capacity"
                label="Capacidad (personas)"
                placeholder="100"
                keyboardType="numeric"
                transform={{
                  input: (value) => value?.toString() || '',
                  output: (value) => value ? parseInt(value, 10) : undefined,
                }}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <Button
              variant="solid"
              size="lg"
              onPress={methods.handleSubmit(onSubmit)}
            >
              <Text>Guardar Cambios</Text>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onPress={() => router.back()}
            >
              <Text>Cancelar</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </FormProvider>
  );
}