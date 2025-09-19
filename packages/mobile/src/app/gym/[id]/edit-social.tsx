import React, { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useLocalSearchParams, router } from 'expo-router';
import { UpdateGymSocialMediaDto } from '@gymspace/sdk';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormInput } from '@/components/forms/FormInput';
import { useLoadingScreen } from '@/shared/loading-screen';
import { Spinner } from '@/components/ui/spinner';
import { useGym, useUpdateGymSocialMedia } from '@/features/gyms/controllers/gyms.controller';

const gymSocialMediaSchema = z.object({
  facebook: z.string().url('URL de Facebook inválida').optional().or(z.literal('')),
  instagram: z.string()
    .regex(/^@?[a-zA-Z0-9._]+$/, 'Usuario de Instagram inválido')
    .optional()
    .or(z.literal('')),
  whatsapp: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Número de WhatsApp inválido')
    .optional()
    .or(z.literal('')),
});

type GymSocialMediaData = z.infer<typeof gymSocialMediaSchema>;

export default function EditGymSocialMediaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { execute } = useLoadingScreen();
  const { data: gym, isLoading } = useGym(id);
  const updateGymSocialMediaMutation = useUpdateGymSocialMedia();

  const methods = useForm<GymSocialMediaData>({
    resolver: zodResolver(gymSocialMediaSchema),
  });

  useEffect(() => {
    if (gym) {
      // Set form default values when gym data is loaded
      methods.reset({
        facebook: gym.socialMedia?.facebook || '',
        instagram: gym.socialMedia?.instagram || '',
        whatsapp: gym.socialMedia?.whatsapp || '',
      });
    }
  }, [gym, methods]);

  const onSubmit = async (data: GymSocialMediaData) => {
    const updatePromise = async () => {
      const updateData: UpdateGymSocialMediaDto = {
        facebook: data.facebook || undefined,
        instagram: data.instagram || undefined,
        whatsapp: data.whatsapp || undefined,
      };

      await updateGymSocialMediaMutation.mutateAsync({ id, data: updateData });
      router.back();
    };

    await execute(updatePromise(), {
      action: 'Actualizando redes sociales...',
      successMessage: 'Redes sociales actualizadas exitosamente',
      errorFormatter: (error: any) => error.message || 'Error al actualizar las redes sociales',
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
      <ScrollView className="flex-1 bg-white">
        <View className="p-4 space-y-4">
          <Text className="text-sm text-gray-600 mb-2">
            Agregue las redes sociales de su gimnasio para que los clientes puedan encontrarlo fácilmente.
          </Text>

          <View className="space-y-4">
            <View>
              <FormInput
                name="facebook"
                label="Facebook"
                placeholder="https://facebook.com/migym"
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text className="text-xs text-gray-500 mt-1">
                Ingrese la URL completa de su página de Facebook
              </Text>
            </View>

            <View>
              <FormInput
                name="instagram"
                label="Instagram"
                placeholder="@migym"
                autoCapitalize="none"
              />
              <Text className="text-xs text-gray-500 mt-1">
                Ingrese su nombre de usuario de Instagram (con o sin @)
              </Text>
            </View>

            <View>
              <FormInput
                name="whatsapp"
                label="WhatsApp"
                placeholder="+1234567890"
                keyboardType="phone-pad"
              />
              <Text className="text-xs text-gray-500 mt-1">
                Ingrese el número de WhatsApp con código de país (ej: +52 para México)
              </Text>
            </View>
          </View>

          <View className="flex-row space-x-3 pt-6 pb-2">
            <Button
              variant="outline"
              size="lg"
              action="secondary"
              className="flex-1"
              onPress={() => router.back()}
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              variant="solid"
              size="lg"
              action="primary"
              className="flex-1"
              onPress={methods.handleSubmit(onSubmit)}
            >
              <ButtonText>Guardar Redes</ButtonText>
            </Button>
          </View>
        </View>
      </ScrollView>
    </FormProvider>
  );
}