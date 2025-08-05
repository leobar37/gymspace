import React, { useState } from 'react';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Badge, BadgeText, BadgeIcon } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Input as GluestackInput, InputField } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSelect } from '@/components/forms/FormSelect';
import { FormSwitch } from '@/components/forms/FormSwitch';
import { PlusIcon, XIcon } from 'lucide-react-native';
import { usePlansController, PlanFormData } from '../controllers/plans.controller';
import { Toast, ToastTitle, ToastDescription, useToast } from '@/components/ui/toast';
import { MembershipPlan } from '@gymspace/sdk';

// Schema validation
const planSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  description: z.string().optional(),
  basePrice: z.coerce.number().min(0, 'El precio debe ser mayor a 0'),
  durationType: z.enum(['days', 'months']).default('months'),
  durationValue: z.coerce.number().min(1, 'La duración debe ser al menos 1'),
  termsAndConditions: z.string().optional(),
  allowsCustomPricing: z.boolean().default(false),
  includesAdvisor: z.boolean().default(false),
  showInCatalog: z.boolean().default(false),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
});

type PlanSchema = z.infer<typeof planSchema>;

interface CreatePlanFormProps {
  initialData?: Partial<MembershipPlan>;
  isEditing?: boolean;
  planId?: string;
}

export const CreatePlanForm: React.FC<CreatePlanFormProps> = ({
  initialData,
  isEditing = false,
  planId,
}) => {
  const { createPlan, updatePlan, isCreatingPlan, isUpdatingPlan } = usePlansController();
  const toast = useToast();
  const [features, setFeatures] = useState<string[]>(initialData?.features || []);
  const [newFeature, setNewFeature] = useState('');

  const form = useForm<PlanSchema>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      basePrice: initialData?.basePrice || 0,
      durationType: initialData?.durationDays ? 'days' : 'months',
      durationValue: initialData?.durationDays || initialData?.durationMonths || 1,
      termsAndConditions: initialData?.termsAndConditions || '',
      allowsCustomPricing: initialData?.allowsCustomPricing || false,
      includesAdvisor: initialData?.includesAdvisor || false,
      showInCatalog: initialData?.showInCatalog || false,
      status: initialData?.status,
    },
  });

  const { control, handleSubmit, formState: { errors } } = form;

  const isSubmitting = isCreatingPlan || isUpdatingPlan;

  // Ensure form is properly initialized
  if (!control) {
    return null;
  }

  const onSubmit = async (data: PlanSchema) => {
    try {
      const planData: PlanFormData = {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        durationMonths: data.durationType === 'months' ? data.durationValue : undefined,
        durationDays: data.durationType === 'days' ? data.durationValue : undefined,
        termsAndConditions: data.termsAndConditions,
        allowsCustomPricing: data.allowsCustomPricing,
        includesAdvisor: data.includesAdvisor,
        showInCatalog: data.showInCatalog,
        status: data.status,
        features,
      };

      if (isEditing && planId) {
        updatePlan(
          { id: planId, data: planData },
          {
            onSuccess: () => {
              toast.show({
                placement: 'top',
                duration: 3000,
                render: ({ id }) => {
                  return (
                    <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                      <ToastTitle>Plan actualizado</ToastTitle>
                      <ToastDescription>
                        El plan se actualizó correctamente
                      </ToastDescription>
                    </Toast>
                  );
                },
              });
              router.back();
            },
            onError: (error) => {
              toast.show({
                placement: 'top',
                duration: 4000,
                render: ({ id }) => {
                  return (
                    <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                      <ToastTitle>Error al actualizar</ToastTitle>
                      <ToastDescription>
                        {error instanceof Error ? error.message : 'No se pudo actualizar el plan'}
                      </ToastDescription>
                    </Toast>
                  );
                },
              });
            },
          }
        );
      } else {
        createPlan(planData, {
          onSuccess: () => {
            toast.show({
              placement: 'top',
              duration: 3000,
              render: ({ id }) => {
                return (
                  <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                    <ToastTitle>Plan creado</ToastTitle>
                    <ToastDescription>
                      El plan se creó correctamente
                    </ToastDescription>
                  </Toast>
                );
              },
            });
            router.replace('/plans');
          },
          onError: (error) => {
            toast.show({
              placement: 'top',
              duration: 4000,
              render: ({ id }) => {
                return (
                  <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                    <ToastTitle>Error al crear</ToastTitle>
                    <ToastDescription>
                      {error instanceof Error ? error.message : 'No se pudo crear el plan'}
                    </ToastDescription>
                  </Toast>
                );
              },
            });
          },
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };


  return (
    <VStack className="p-4 gap-4">
        <VStack className="gap-4">
          <Text className="text-lg font-semibold">Campos Requeridos</Text>
          
          <FormInput
            control={control}
            name="name"
            label="Nombre del plan *"
            placeholder="Ej: Plan Básico"
          />

          <FormInput
            control={control}
            name="basePrice"
            label="Precio *"
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <VStack className="gap-2">
            <Text className="font-medium text-gray-900">Duración *</Text>
            <HStack className="gap-2">
              <VStack className="flex-1">
                <FormSelect
                  control={control}
                  name="durationType"
                  label=""
                  placeholder="Seleccionar"
                  options={[
                    { label: 'Días', value: 'days' },
                    { label: 'Meses', value: 'months' },
                  ]}
                />
              </VStack>
              <VStack className="flex-1">
                <FormInput
                  control={control}
                  name="durationValue"
                  label=""
                  placeholder={form.watch('durationType') === 'days' ? 'Días' : 'Meses'}
                  keyboardType="number-pad"
                />
              </VStack>
            </HStack>
          </VStack>
        </VStack>

        <Divider />

        <VStack className="gap-4">
          <Text className="text-lg font-semibold">Campos Opcionales</Text>
          
          <FormTextarea
            label="Descripción"
            placeholder="Describe las características del plan"
            value={form.watch('description') || ''}
            onChangeText={(text) => form.setValue('description', text)}
            error={errors.description?.message}
          />
        </VStack>

        <Divider />

        <VStack className="gap-4">
          <Text className="text-lg font-semibold">Características</Text>
          
          <VStack className="gap-2">
            <Text className="text-sm font-medium text-gray-700">
              Características incluidas
            </Text>
            
            <HStack className="gap-2">
              <GluestackInput variant="rounded" size="md" className="flex-1">
                <InputField
                  placeholder="Añadir característica"
                  value={newFeature}
                  onChangeText={setNewFeature}
                  onSubmitEditing={addFeature}
                  returnKeyType="done"
                  placeholderClassName="text-gray-400"
                />
              </GluestackInput>
              <Button size="sm" onPress={addFeature}>
                <Icon as={PlusIcon} className="text-white" />
              </Button>
            </HStack>

            <HStack className="flex-wrap gap-2 mt-2">
              {features.map((feature, index) => (
                <Badge key={index} action="muted" size="md">
                  <BadgeText>{feature}</BadgeText>
                  <Pressable onPress={() => removeFeature(index)}>
                    <BadgeIcon
                      as={XIcon}
                      className="ml-1"
                    />
                  </Pressable>
                </Badge>
              ))}
            </HStack>
          </VStack>

        </VStack>

        <Divider />

        <VStack className="gap-4">
          <Text className="text-lg font-semibold">Opciones adicionales</Text>
          
          <FormSwitch
            control={control}
            name="allowsCustomPricing"
            label="Permitir precio personalizado"
            description="Los contratos pueden tener un precio diferente"
          />

          <FormSwitch
            control={control}
            name="includesAdvisor"
            label="Incluye asesor"
            description="Los clientes tendrán acceso a un asesor personal"
          />

          <FormSwitch
            control={control}
            name="showInCatalog"
            label="Mostrar en catálogo público"
            description="El plan será visible en tu página pública"
          />
        </VStack>

        <Divider />

        <FormTextarea
          label="Términos y condiciones"
          placeholder="Ingresa los términos y condiciones del plan"
          value={form.watch('termsAndConditions') || ''}
          onChangeText={(text) => form.setValue('termsAndConditions', text)}
          error={errors.termsAndConditions?.message}
          numberOfLines={4}
        />

        <VStack className="gap-3 mt-6">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            size="lg"
            className="w-full"
          >
            <ButtonText>
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Crear plan'}
            </ButtonText>
          </Button>
          <Button
            variant="outline"
            onPress={() => router.back()}
            disabled={isSubmitting}
            size="md"
            className="w-full"
          >
            <ButtonText>Cancelar</ButtonText>
          </Button>
        </VStack>
      </VStack>
  );
};