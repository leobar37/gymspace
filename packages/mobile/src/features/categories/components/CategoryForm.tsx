import React from 'react';
import { View } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { FormProvider, FormInput, FormTextarea } from '@/components/forms';
import { useForm } from 'react-hook-form';
import { CategoryFormData } from '../controllers/categories.controller';
import { ProductCategory } from '@gymspace/sdk';
import { Pressable } from '@/components/ui/pressable';

interface CategoryFormProps {
  initialData?: ProductCategory;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#6366F1', // Indigo
];

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  const form = useForm<CategoryFormData>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      color: initialData?.color || PRESET_COLORS[0],
    },
  });

  const selectedColor = form.watch('color');

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <FormProvider {...form}>
      <VStack space="lg">
        <FormInput
          name="name"
          label="Nombre de la categoría"
          placeholder="Ej: Suplementos"
          rules={{
            required: 'El nombre es requerido',
            minLength: {
              value: 2,
              message: 'El nombre debe tener al menos 2 caracteres'
            },
            maxLength: {
              value: 50,
              message: 'El nombre no puede tener más de 50 caracteres'
            }
          }}
        />

        <FormTextarea
          name="description"
          label="Descripción (opcional)"
          placeholder="Describe esta categoría de productos"
          numberOfLines={3}
          rules={{
            maxLength: {
              value: 200,
              message: 'La descripción no puede tener más de 200 caracteres'
            }
          }}
        />

        <VStack space="sm">
          <Text className="text-gray-700 font-medium">Color de la categoría</Text>
          <View className="flex-row flex-wrap gap-3">
            {PRESET_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => form.setValue('color', color)}
                className={`w-12 h-12 rounded-lg ${
                  selectedColor === color ? 'border-2 border-blue-600' : ''
                }`}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-white font-bold">✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
          {selectedColor && (
            <HStack space="sm" className="items-center mt-2">
              <View 
                className="w-6 h-6 rounded"
                style={{ backgroundColor: selectedColor }}
              />
              <Text className="text-gray-600 text-sm">
                Color seleccionado
              </Text>
            </HStack>
          )}
        </VStack>

        <Button
          onPress={handleSubmit}
          disabled={isSubmitting}
          className="mt-4"
        >
          <ButtonText>
            {isSubmitting 
              ? 'Guardando...' 
              : initialData 
                ? 'Actualizar Categoría' 
                : 'Crear Categoría'
            }
          </ButtonText>
        </Button>
      </VStack>
    </FormProvider>
  );
};