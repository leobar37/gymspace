import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Button, ButtonText } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { useCountryConfig } from '@/config/ConfigContext';
import { AssetSelector } from '@/features/assets/components/AssetSelector';
import { useProductsController } from '@/features/products/controllers/products.controller';
import { useProduct } from '@/features/products/hooks/useProducts';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { useLoadingScreen } from '@/shared/loading-screen';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'El precio debe ser un número válido mayor a 0',
  }),
  categoryId: z.string().optional(),
  imageId: z.string().optional().nullable(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { execute } = useLoadingScreen();
  const { updateProduct } = useProductsController();
  const config = useCountryConfig();

  // Fetch existing service data
  const { data: service, isLoading } = useProduct(id);

  const methods = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      categoryId: '',
      imageId: '',
    },
    mode: 'onChange',
  });

  // Update form values when service data is loaded
  React.useEffect(() => {
    if (service && !isLoading) {
      methods.reset({
        name: service.name || '',
        description: service.description || '',
        price: service.price?.toString() || '',
        categoryId: service.categoryId || '',
        imageId: service.imageId || '',
      });
    }
  }, [service, isLoading, methods]);

  const {
    formState: { isValid, isDirty },
  } = methods;

  // Button is disabled if form is not valid, not dirty, or request is pending
  const isButtonDisabled = !isValid || !isDirty || updateProduct.isPending;

  const handleSubmit = async (data: ServiceFormData) => {
    if (!id) return;

    await execute(
      updateProduct.mutateAsync({
        id,
        data: {
          name: data.name,
          description: data.description || undefined,
          price: parseFloat(data.price),
          categoryId: data.categoryId || undefined,
          imageId: data.imageId || undefined,
        },
      }),
      {
        action: 'Actualizando servicio...',
        successMessage: 'Servicio actualizado exitosamente',
        successActions: [
          {
            label: 'Ver servicio',
            onPress: () => {
              router.replace(`/inventory/services/${id}`);
            },
            variant: 'solid',
          },
          {
            label: 'Ver lista',
            onPress: () => {
              router.replace('/inventory/services');
            },
            variant: 'outline',
          },
        ],
        errorFormatter: (error) => {
          if (error instanceof Error) {
            return `Error al actualizar servicio: ${error.message}`;
          }
          return 'No se pudo actualizar el servicio. Por favor intente nuevamente.';
        },
        hideOnSuccess: false,
      },
    );
  };

  // Show loading spinner while fetching service data
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Spinner size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Show error if service not found
  if (!service && !isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center p-4">
          <View className="items-center">
            <Text className="text-lg font-semibold text-gray-900 mb-2">Servicio no encontrado</Text>
            <Text className="text-sm text-gray-600 text-center">
              El servicio que buscas no existe o ha sido eliminado.
            </Text>
            <Button onPress={() => router.back()} variant="outline" className="mt-4">
              <ButtonText>Volver</ButtonText>
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FormProvider {...methods}>
        <ScreenForm
          showFixedFooter={true}
          showBackButton={false}
          useSafeArea={false}
          footerContent={
            <Button
              onPress={methods.handleSubmit(handleSubmit)}
              isDisabled={isButtonDisabled}
              variant="solid"
              className="w-full"
            >
              <ButtonText>Guardar Cambios</ButtonText>
            </Button>
          }
        >
          {/* Form Fields */}
          <View className="space-y-4 bg-white">
            <FormInput
              name="name"
              label="Nombre del Servicio"
              placeholder="Ej: Entrenamiento Personal"
              autoCapitalize="words"
            />

            <FormTextarea
              name="description"
              label="Descripción"
              placeholder="Describe el servicio..."
              numberOfLines={3}
            />

            <FormInput
              name="price"
              label={`Precio (${config?.currency || 'PEN'})`}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <AssetSelector
              name="imageId"
              label="Imagen del Servicio"
              multi={false}
              required={false}
            />
          </View>
        </ScreenForm>
      </FormProvider>
    </SafeAreaView>
  );
}
