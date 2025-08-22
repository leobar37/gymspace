import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScrollView } from 'react-native';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { FormInput } from '@/components/forms';
import { Card } from '@/components/ui/card';
import { useLoadingScreen } from '@/shared/loading-screen';
import { useUpdateOrganization } from '../controllers/organizations.controller';

const organizationUpdateSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
});

type OrganizationUpdateForm = z.infer<typeof organizationUpdateSchema>;

interface OrganizationUpdateFormProps {
  organization: {
    id: string;
    name: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function OrganizationUpdateForm({ 
  organization, 
  onSuccess,
  onCancel
}: OrganizationUpdateFormProps) {
  const { execute } = useLoadingScreen();
  const updateOrganization = useUpdateOrganization();

  const form = useForm<OrganizationUpdateForm>({
    resolver: zodResolver(organizationUpdateSchema),
    defaultValues: {
      name: organization.name,
    },
  });

  const onSubmit = async (data: OrganizationUpdateForm) => {
    await execute(
      updateOrganization.mutateAsync({ 
        id: organization.id, 
        data 
      }),
      {
        action: 'Actualizando organización...',
        successMessage: 'Organización actualizada exitosamente',
        successActions: [
          {
            label: 'Continuar',
            onPress: () => onSuccess?.(),
          }
        ],
        errorFormatter: (error: any) => 
          error?.message || 'Error al actualizar la organización',
        onSuccess: () => onSuccess?.(),
      }
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <FormProvider {...form}>
        <VStack className="p-4 pb-8" space="md">
          <Card className="p-4 bg-white rounded-xl shadow-sm">
            <VStack space="md">
              <Text className="text-lg font-semibold text-gray-900">
                Información de la Organización
              </Text>
              
              <VStack space="sm">
                <FormInput
                  name="name"
                  label="Nombre de la Organización"
                  placeholder="Ejemplo: Mi Gimnasio Elite"
                  description="Nombre que identificará tu organización"
                />
              </VStack>
            </VStack>
          </Card>

          <VStack space="sm">
            <Button 
              onPress={form.handleSubmit(onSubmit)}
              isDisabled={updateOrganization.isPending}
            >
              <ButtonText>
                {updateOrganization.isPending ? 'Actualizando...' : 'Guardar Cambios'}
              </ButtonText>
            </Button>
            
            {onCancel && (
              <Button 
                variant="outline" 
                onPress={onCancel}
                isDisabled={updateOrganization.isPending}
              >
                <ButtonText>Cancelar</ButtonText>
              </Button>
            )}
          </VStack>
        </VStack>
      </FormProvider>
    </ScrollView>
  );
}