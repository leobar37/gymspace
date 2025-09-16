import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm, FormProvider } from 'react-hook-form';
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
import { MembershipPlan } from '@gymspace/sdk';
import { AssetSelector } from '@/features/assets/components/AssetSelector';
import { useLoadingScreen } from '@/shared/loading-screen';

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
  assetsIds: z.array(z.string()).optional(),
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
  const { execute } = useLoadingScreen();
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
      assetsIds: [],
    },
    mode: 'onChange',
  });

  const { handleSubmit } = form;

  const isSubmitting = isCreatingPlan || isUpdatingPlan;

  const onSubmit = async (data: PlanSchema) => {
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
      assetsIds: data.assetsIds || [],
    };

    if (isEditing && planId) {
      await execute(
        updatePlan.mutateAsync({ id: planId, data: planData }),
        {
          action: 'Actualizando plan...',
          successMessage: 'El plan se actualizó correctamente',
          successActions: [
            {
              label: 'Ver plan',
              onPress: () => {
                router.replace(`/plans/${planId}`);
              },
              variant: 'solid',
            },
            {
              label: 'Ir al listado',
              onPress: () => {
                router.replace('/plans');
              },
              variant: 'outline',
            },
          ],
          errorFormatter: (error) => {
            if (error instanceof Error) {
              return `Error al actualizar: ${error.message}`;
            }
            return 'No se pudo actualizar el plan';
          },
          hideOnSuccess: false,
        }
      );
    } else {
      await execute(
        createPlan.mutateAsync(planData),
        {
          action: 'Creando plan...',
          successMessage: `El plan "${data.name}" se creó correctamente`,
          successActions: [
            {
              label: 'Ver planes',
              onPress: () => {
                router.replace('/plans');
              },
              variant: 'solid',
            },
            {
              label: 'Crear otro',
              onPress: () => {
                form.reset();
                setFeatures([]);
              },
              variant: 'outline',
            },
          ],
          errorFormatter: (error) => {
            if (error instanceof Error) {
              return `Error al crear: ${error.message}`;
            }
            return 'No se pudo crear el plan';
          },
          hideOnSuccess: false,
        }
      );
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
    <FormProvider {...form}>
      <VStack className="p-4 gap-4">
        <VStack className="gap-4">
          <Text className="text-lg font-semibold">Campos Requeridos</Text>
          
          <FormInput
            name="name"
            label="Nombre del plan *"
            placeholder="Ej: Plan Básico"
          />

          <FormInput
            name="basePrice"
            label="Precio *"
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <VStack className="gap-2">
            <Text className="font-medium text-gray-900">Duración *</Text>
            <HStack className="gap-2 items-end">
              <View className="flex-1">
                <FormInput
                  name="durationValue"
                  label=""
                  placeholder="Cantidad"
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <FormSelect
                  name="durationType"
                  placeholder="Periodo"
                  options={[
                    { label: 'Días', value: 'days' },
                    { label: 'Meses', value: 'months' },
                  ]}
                />
              </View>
            </HStack>
          </VStack>
        </VStack>

        <Divider />

        <VStack className="gap-4">
          <Text className="text-lg font-semibold">Campos Opcionales</Text>
          
          <FormTextarea
            name="description"
            label="Descripción"
            placeholder="Describe las características del plan"
          />

          <AssetSelector
            name="assetsIds"
            label="Imágenes del plan"
            multi={true}
            required={false}
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
            name="allowsCustomPricing"
            label="Permitir precio personalizado"
            description="Los contratos pueden tener un precio diferente"
          />

          <FormSwitch
            name="includesAdvisor"
            label="Incluye asesor"
            description="Los clientes tendrán acceso a un asesor personal"
          />

          <FormSwitch
            name="showInCatalog"
            label="Mostrar en catálogo público"
            description="El plan será visible en tu página pública"
          />
        </VStack>

        <Divider />

        <FormTextarea
          name="termsAndConditions"
          label="Términos y condiciones"
          placeholder="Ingresa los términos y condiciones del plan"
          numberOfLines={4}
        />

        <VStack className="gap-3 mt-6">
          <Button
            onPress={handleSubmit(onSubmit)}
            isDisabled={isSubmitting || !form.formState.isValid}
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
            isDisabled={isSubmitting || !form.formState.isValid}
            size="md"
            className="w-full"
          >
            <ButtonText>Cancelar</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </FormProvider>
  );
};