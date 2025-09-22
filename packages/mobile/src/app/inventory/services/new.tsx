import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Button, ButtonText } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { useCountryConfig } from '@/config/ConfigContext';
import { AssetSelector } from '@/features/assets/components/AssetSelector';
import { useProductsController } from '@/features/products/controllers/products.controller';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { useLoadingScreen } from '@/shared/loading-screen';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'El precio debe ser un número válido',
  }),
  categoryId: z.string().optional(),
  imageId: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function NewServiceScreen() {
  const { execute } = useLoadingScreen();
  const { createService } = useProductsController();
  const config = useCountryConfig();

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

  const {
    formState: { isValid },
  } = methods;

  const isButtonDisabled = !isValid || createService.isPending;

  const handleSubmit = async (data: ServiceFormData) => {
    await execute(
      createService.mutateAsync({
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        categoryId: data.categoryId || undefined,
        imageId: data.imageId || undefined,
      }),
      {
        action: 'Creando servicio...',
        successMessage: 'Servicio creado exitosamente',
        successActions: [
          {
            label: 'Ver servicios',
            onPress: () => {
              router.replace('/inventory/services');
            },
            variant: 'solid',
          },
          {
            label: 'Crear otro',
            onPress: () => {
              methods.reset();
            },
            variant: 'outline',
          },
        ],
        errorFormatter: (error) => {
          if (error instanceof Error) {
            return `Error al crear servicio: ${error.message}`;
          }
          return 'No se pudo crear el servicio. Por favor intente nuevamente.';
        },
        hideOnSuccess: false,
      },
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white">
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
              <ButtonText>Crear Servicio</ButtonText>
            </Button>
          }
        >
          {/* Form Fields */}
          <VStack className="gap-y-3 bg-white">
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
          </VStack>
        </ScreenForm>
      </FormProvider>
    </SafeAreaView>
  );
}
