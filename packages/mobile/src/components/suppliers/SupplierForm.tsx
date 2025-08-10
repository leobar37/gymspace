import React from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSwitch } from '@/components/forms/FormSwitch';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useCreateSupplier, useUpdateSupplier } from '@/features/suppliers/controllers/suppliers.controller';

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  rfc: z.string().optional(),
  contactName: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().default(true),
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
      rfc: initialData?.rfc || '',
      contactName: initialData?.contactName || '',
      notes: initialData?.notes || '',
      active: initialData?.active ?? true,
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="lg" className="p-4">
          {/* Basic Information */}
          <Card className="bg-white border border-gray-200">
            <VStack space="md" className="p-4">
              <Heading size="md" className="text-gray-900">
                Información General
              </Heading>
              
              <FormInput
                name="name"
                label="Nombre del Proveedor *"
                placeholder="Ej: Distribuidora ABC"
              />

              <FormInput
                name="rfc"
                label="RFC"
                placeholder="Ej: ABC123456789"
                autoCapitalize="characters"
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
          </Card>

          {/* Contact Information */}
          <Card className="bg-white border border-gray-200">
            <VStack space="md" className="p-4">
              <Heading size="md" className="text-gray-900">
                Información de Contacto
              </Heading>

              <FormInput
                name="contactName"
                label="Nombre del Contacto"
                placeholder="Ej: Juan Pérez"
              />

              <FormTextarea
                name="notes"
                label="Notas"
                placeholder="Información adicional sobre el proveedor"
                numberOfLines={4}
              />
            </VStack>
          </Card>

          {/* Status */}
          <Card className="bg-white border border-gray-200">
            <VStack space="md" className="p-4">
              <Heading size="md" className="text-gray-900">
                Estado
              </Heading>

              <FormSwitch
                name="active"
                label="Proveedor Activo"
                description="Desactiva este proveedor si ya no trabajas con él"
              />
            </VStack>
          </Card>

          {/* Action Buttons */}
          <HStack space="sm" className="pb-4">
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
              disabled={isSubmitting}
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