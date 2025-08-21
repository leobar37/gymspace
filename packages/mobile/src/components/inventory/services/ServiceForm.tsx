import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VStack } from '@/components/ui/vstack';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Button, ButtonText } from '@/components/ui/button';
import { useCountryConfig } from '@/config/ConfigContext';
import type { Product, ProductCategory } from '@gymspace/sdk';

const serviceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'El precio debe ser un número válido',
  }),
  categoryId: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  service?: Product;
  categories?: ProductCategory[];
  onSubmit: (data: ServiceFormData) => Promise<void>;
  isLoading?: boolean;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  categories = [],
  onSubmit,
  isLoading = false,
}) => {
  const config = useCountryConfig();
  
  const methods = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name || '',
      description: service?.description || '',
      price: service?.price?.toString() || '',
      categoryId: service?.categoryId || '',
    },
  });

  const handleSubmit = async (data: ServiceFormData) => {
    await onSubmit(data);
  };

  const categoryOptions = [
    { label: 'Sin categoría', value: '' },
    ...categories.map((cat) => ({
      label: cat.name,
      value: cat.id,
    })),
  ];

  return (
    <FormProvider {...methods}>
      <VStack space="md">
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


        <Button
          onPress={methods.handleSubmit(handleSubmit)}
          isDisabled={isLoading}
          className="mt-4"
        >
          <ButtonText>
            {service ? 'Actualizar Servicio' : 'Crear Servicio'}
          </ButtonText>
        </Button>
      </VStack>
    </FormProvider>
  );
};