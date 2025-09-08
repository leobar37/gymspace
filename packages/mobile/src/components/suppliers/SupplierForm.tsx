import React from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useCreateSupplier, useUpdateSupplier } from '@/features/suppliers/controllers/suppliers.controller';

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  contactInfo: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  initialData?: Partial<SupplierFormData>;
  supplierId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  initialData,
  supplierId,
  onSuccess,
  onCancel,
}) => {
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const isEditing = !!supplierId;

  const methods = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      contactInfo: initialData?.contactInfo || '',
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = methods;

  const onSubmit = async (data: SupplierFormData) => {
    try {
      // Clean empty strings
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value === '') {
          return acc;
        }
        return { ...acc, [key]: value };
      }, {} as any);

      if (isEditing && supplierId) {
        await updateMutation.mutateAsync({ id: supplierId, data: cleanedData });
      } else {
        await createMutation.mutateAsync(cleanedData);
      }
      
      onSuccess?.();
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  return (
    <FormProvider {...methods}>
      <ScrollView showsVerticalScrollIndicator={false} className="bg-white">
        <VStack space="lg" className="p-3">
          {/* Basic Information */}
          <VStack space="md">
            <Heading size="md" className="text-gray-900">
              Información General
            </Heading>
            
            <FormInput
              name="name"
              label="Nombre del Proveedor *"
              placeholder="Ej: Distribuidora ABC"
            />

            <FormInput
              name="phone"
              label="Teléfono"
              placeholder="Ej: 555-123-4567"
              keyboardType="phone-pad"
            />

            <FormInput
              name="email"
              label="Email"
              placeholder="Ej: contacto@proveedor.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FormTextarea
              name="address"
              label="Dirección"
              placeholder="Calle, número, colonia, ciudad"
              numberOfLines={3}
            />
          </VStack>

          {/* Contact Information */}
          <VStack space="md">
            <Heading size="md" className="text-gray-900">
              Información de Contacto
            </Heading>

            <FormTextarea
              name="contactInfo"
              label="Información de Contacto"
              placeholder="Persona de contacto, notas adicionales, etc."
              numberOfLines={4}
            />
          </VStack>


          {/* Action Buttons */}
          <HStack space="sm" className="pb-2">
            {onCancel && (
              <Button
                variant="outline"
                onPress={onCancel}
                className="flex-1"
              >
                <ButtonText>Cancelar</ButtonText>
              </Button>
            )}
            
            <Button
              variant="solid"
              onPress={handleSubmit(onSubmit)}
              isDisabled={isSubmitting || !isValid}
              className="flex-1"
            >
              <ButtonText>
                {isSubmitting 
                  ? 'Guardando...' 
                  : isEditing 
                    ? 'Actualizar Proveedor' 
                    : 'Crear Proveedor'}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </FormProvider>
  );
};