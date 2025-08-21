import React from 'react';
import { router } from 'expo-router';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Button, ButtonText } from '@/components/ui/button';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { useProductsController } from '@/features/products/controllers/products.controller';
import { useProductCategories } from '@/hooks/useProducts';
import { useLoadingScreen } from '@/shared/loading-screen';
import { useCountryConfig } from '@/config/ConfigContext';

const serviceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'El precio debe ser un número válido',
  }),
  categoryId: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function NewServiceScreen() {
  const { execute } = useLoadingScreen();
  const { createService } = useProductsController();
  const { data: categories } = useProductCategories();
  const config = useCountryConfig();

  const methods = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      categoryId: '',
    },
    mode: 'onChange',
  });

  const { formState: { isValid, isDirty } } = methods;
  const isButtonDisabled = !isValid || !isDirty || createService.isPending;

  const handleSubmit = async (data: ServiceFormData) => {
    await execute(
      createService.mutateAsync({
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        categoryId: data.categoryId || undefined,
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
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FormProvider {...methods}>
        <ScreenForm
          actions={
            <Button
              onPress={methods.handleSubmit(handleSubmit)}
              isDisabled={isButtonDisabled}
              variant="solid"
            >
              <ButtonText>Crear Servicio</ButtonText>
            </Button>
          }
        >
          {/* Header */}
          <View className="mb-6 mt-4">
            <Text className="text-2xl font-bold text-gray-900">Nuevo Servicio</Text>
            <Text className="text-sm text-gray-600 mt-1">
              Agrega un nuevo servicio al catálogo
            </Text>
          </View>

          {/* Form Fields */}
          <View className="space-y-4">
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
          </View>
        </ScreenForm>
      </FormProvider>
    </SafeAreaView>
  );
}