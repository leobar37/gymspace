import React from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { SaveIcon, XIcon } from 'lucide-react-native';
import { useFormatPrice } from '@/config/ConfigContext';
import { AssetSelector } from '@/features/assets/components/AssetSelector';
import { CategorySelector } from '@/features/categories/components/CategorySelector';
import { FormProvider } from '@/components/forms/FormProvider';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSwitch } from '@/components/forms/FormSwitch';
import { ScreenForm } from '@/shared/components/ScreenForm';
import type { Product, CreateProductDto, UpdateProductDto } from '@gymspace/sdk';

// Zod validation schema
const productFormSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, 'El precio es requerido')
    .refine((val) => {
      const price = parseFloat(val);
      return !isNaN(price) && price >= 0;
    }, 'El precio debe ser un número válido mayor o igual a 0'),
  stock: z
    .string()
    .min(1, 'El stock es requerido')
    .refine((val) => {
      const stock = parseInt(val);
      return !isNaN(stock) && stock >= 0;
    }, 'El stock debe ser un número entero mayor o igual a 0'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  isActive: z.boolean(),
  imageId: z.string().nullable().optional(),
});

type FormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: CreateProductDto | UpdateProductDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, isLoading = false }: ProductFormProps) {
  const formatPrice = useFormatPrice();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize react-hook-form with Zod resolver
  const methods = useForm<FormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price?.toString() || '',
      stock: product?.stock?.toString() || '',
      categoryId: product?.categoryId || '',
      isActive: product ? product.status === 'active' : true,
      imageId: product?.imageId || null,
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isValid },
  } = methods;

  const handleFormSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);

    try {
      const submitData: CreateProductDto | UpdateProductDto = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        categoryId: data.categoryId,
        status: data.isActive ? 'active' : 'inactive',
        imageId: data.imageId || undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting product form:', error);
      Alert.alert('Error', 'No se pudo guardar el producto. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  });

  const isFormLoading = isLoading || isSubmitting;
  const priceValue = watch('price');
  const isActiveValue = watch('isActive');

  const actions = (
    <HStack space="md">
      <Button variant="outline" onPress={onCancel} disabled={isFormLoading} className="flex-1">
        <Icon as={XIcon} className="w-4 h-4 text-gray-600 mr-2" />
        <ButtonText className="text-gray-600">Cancelar</ButtonText>
      </Button>
      <Button
        onPress={handleFormSubmit}
        isDisabled={product ? isFormLoading || !isDirty || !isValid : isFormLoading || !isValid}
        className="flex-1"
      >
        {isFormLoading ? (
          <HStack space="sm" className="items-center">
            <Spinner size="small" color="white" />
            <ButtonText className="text-white">Guardando...</ButtonText>
          </HStack>
        ) : (
          <HStack space="sm" className="items-center">
            <Icon as={SaveIcon} className="w-4 h-4 text-white" />
            <ButtonText className="text-white font-semibold">
              {product ? 'Actualizar' : 'Crear'} Producto
            </ButtonText>
          </HStack>
        )}
      </Button>
    </HStack>
  );

  return (
    <FormProvider {...methods}>
      <ScreenForm
        showFixedFooter={true}
        showBackButton={false}
        useSafeArea={false}
        footerContent={actions}
      >
        <VStack space="lg">
          {/* Basic Information */}
          <Card className="bg-white border border-gray-200">
            <VStack space="md" className="p-4">
              <Text className="text-lg font-semibold text-gray-900">Información Básica</Text>

              {/* Product Name */}
              <FormInput
                name="name"
                control={control}
                label="Nombre del Producto *"
                placeholder="Ej: Mancuerna 10kg"
              />

              {/* Description */}
              <FormTextarea
                name="description"
                control={control}
                label="Descripción"
                placeholder="Describe el producto (opcional)"
                numberOfLines={3}
              />

              {/* Category */}
              <CategorySelector
                name="categoryId"
                control={control}
                label="Categoría *"
                placeholder="Selecciona una categoría"
                enabled={!isFormLoading}
              />
            </VStack>
          </Card>

          {/* Pricing and Stock */}
          <Card className="bg-white border border-gray-200">
            <VStack space="md" className="p-4">
              <Text className="text-lg font-semibold text-gray-900">Precio e Inventario</Text>

              <HStack space="md">
                {/* Price */}
                <VStack className="flex-1">
                  <FormInput
                    name="price"
                    control={control}
                    label="Precio *"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </VStack>

                {/* Stock */}
                <VStack className="flex-1">
                  <FormInput
                    name="stock"
                    control={control}
                    label="Stock inicial*"
                    placeholder="0"
                    keyboardType="number-pad"
                  />
                </VStack>
              </HStack>

              {/* Price Preview */}
              {priceValue && !errors.price && (
                <Card className="bg-blue-50 border-blue-200">
                  <HStack className="p-3 justify-between items-center">
                    <Text className="text-sm text-blue-700">Precio formateado:</Text>
                    <Text className="text-lg font-bold text-blue-900">
                      {formatPrice(parseFloat(priceValue))}
                    </Text>
                  </HStack>
                </Card>
              )}
            </VStack>
          </Card>

          {/* Additional Settings */}
          <Card className="bg-white border border-gray-200">
            <VStack space="md" className="p-4">
              <Text className="text-lg font-semibold text-gray-900">Configuración Adicional</Text>

              {/* Status */}
              <FormSwitch
                name="isActive"
                control={control}
                label="Estado del Producto"
                description={
                  isActiveValue
                    ? 'El producto está disponible para la venta'
                    : 'El producto no está disponible para la venta'
                }
              />

              {/* Image Selector */}
              <AssetSelector
                name="imageId"
                label="Imagen del Producto"
                multi={false}
                required={false}
              />
            </VStack>
          </Card>
        </VStack>
      </ScreenForm>
    </FormProvider>
  );
}
