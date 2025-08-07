import React, { useState, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectTrigger, SelectInput, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText, FormControlError, FormControlErrorIcon, FormControlErrorText } from '@/components/ui/form-control';
import { 
  SaveIcon, 
  XIcon,
  PackageIcon,
  TagIcon,
  DollarSignIcon,
  HashIcon,
  FileTextIcon,
  ImageIcon
} from 'lucide-react-native';
import { useFormatPrice } from '@/config/ConfigContext';
import { useProductCategories } from '@/hooks/useProducts';
import type { Product, CreateProductDto, UpdateProductDto, ProductCategory } from '@gymspace/sdk';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: CreateProductDto | UpdateProductDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
}

interface FormErrors {
  name?: string;
  price?: string;
  stock?: string;
  categoryId?: string;
}

export function ProductForm({ product, onSubmit, onCancel, isLoading = false }: ProductFormProps) {
  const formatPrice = useFormatPrice();
  const { data: categories, isLoading: loadingCategories } = useProductCategories();
  
  const [formData, setFormData] = useState<FormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    stock: product?.stock?.toString() || '',
    categoryId: product?.categoryId || '',
    status: product?.status || 'active',
    imageUrl: product?.imageUrl || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'El precio es requerido';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        newErrors.price = 'El precio debe ser un número válido mayor o igual a 0';
      }
    }

    if (!formData.stock.trim()) {
      newErrors.stock = 'El stock es requerido';
    } else {
      const stock = parseInt(formData.stock);
      if (isNaN(stock) || stock < 0) {
        newErrors.stock = 'El stock debe ser un número entero mayor o igual a 0';
      }
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'La categoría es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const data: CreateProductDto | UpdateProductDto = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        categoryId: formData.categoryId,
        status: formData.status,
        imageUrl: formData.imageUrl?.trim() || undefined,
      };

      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting product form:', error);
      Alert.alert(
        'Error',
        'No se pudo guardar el producto. Por favor intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof FormData, value: string | 'active' | 'inactive') => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for the field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormLoading = isLoading || isSubmitting || loadingCategories;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <VStack space="lg" className="p-4">
        {/* Basic Information */}
        <Card className="bg-white border border-gray-200">
          <VStack space="md" className="p-4">
            <Text className="text-lg font-semibold text-gray-900">
              Información Básica
            </Text>

            {/* Product Name */}
            <FormControl isInvalid={!!errors.name}>
              <FormControlLabel>
                <FormControlLabelText>Nombre del Producto *</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  placeholder="Ej: Mancuerna 10kg"
                  value={formData.name}
                  onChangeText={(value) => handleFieldChange('name', value)}
                />
              </Input>
              {errors.name && (
                <FormControlError>
                  <FormControlErrorText>{errors.name}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Descripción</FormControlLabelText>
              </FormControlLabel>
              <Textarea>
                <TextareaInput
                  placeholder="Describe el producto (opcional)"
                  value={formData.description}
                  onChangeText={(value) => handleFieldChange('description', value)}
                  numberOfLines={3}
                />
              </Textarea>
            </FormControl>

            {/* Category */}
            <FormControl isInvalid={!!errors.categoryId}>
              <FormControlLabel>
                <FormControlLabelText>Categoría *</FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={formData.categoryId}
                onValueChange={(value) => handleFieldChange('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectInput 
                    placeholder="Selecciona una categoría"
                    value={categories?.find(c => c.id === formData.categoryId)?.name || ''}
                  />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {loadingCategories ? (
                      <VStack className="p-4 items-center">
                        <Spinner size="small" />
                        <Text className="text-gray-600 mt-2">Cargando categorías...</Text>
                      </VStack>
                    ) : (
                      categories?.map((category) => (
                        <SelectItem 
                          key={category.id} 
                          label={category.name} 
                          value={category.id} 
                        />
                      ))
                    )}
                  </SelectContent>
                </SelectPortal>
              </Select>
              {errors.categoryId && (
                <FormControlError>
                  <FormControlErrorText>{errors.categoryId}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>
          </VStack>
        </Card>

        {/* Pricing and Stock */}
        <Card className="bg-white border border-gray-200">
          <VStack space="md" className="p-4">
            <Text className="text-lg font-semibold text-gray-900">
              Precio e Inventario
            </Text>

            <HStack space="md">
              {/* Price */}
              <VStack className="flex-1">
                <FormControl isInvalid={!!errors.price}>
                  <FormControlLabel>
                    <FormControlLabelText>Precio *</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      placeholder="0.00"
                      value={formData.price}
                      onChangeText={(value) => handleFieldChange('price', value)}
                      keyboardType="decimal-pad"
                    />
                  </Input>
                  {errors.price && (
                    <FormControlError>
                      <FormControlErrorText>{errors.price}</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              </VStack>

              {/* Stock */}
              <VStack className="flex-1">
                <FormControl isInvalid={!!errors.stock}>
                  <FormControlLabel>
                    <FormControlLabelText>Stock *</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      placeholder="0"
                      value={formData.stock}
                      onChangeText={(value) => handleFieldChange('stock', value)}
                      keyboardType="number-pad"
                    />
                  </Input>
                  {errors.stock && (
                    <FormControlError>
                      <FormControlErrorText>{errors.stock}</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              </VStack>
            </HStack>

            {/* Price Preview */}
            {formData.price && !errors.price && (
              <Card className="bg-blue-50 border-blue-200">
                <HStack className="p-3 justify-between items-center">
                  <Text className="text-sm text-blue-700">
                    Precio formateado:
                  </Text>
                  <Text className="text-lg font-bold text-blue-900">
                    {formatPrice(parseFloat(formData.price))}
                  </Text>
                </HStack>
              </Card>
            )}
          </VStack>
        </Card>

        {/* Additional Settings */}
        <Card className="bg-white border border-gray-200">
          <VStack space="md" className="p-4">
            <Text className="text-lg font-semibold text-gray-900">
              Configuración Adicional
            </Text>

            {/* Status */}
            <FormControl>
              <HStack className="justify-between items-center">
                <VStack className="flex-1">
                  <FormControlLabel>
                    <FormControlLabelText>Estado del Producto</FormControlLabelText>
                  </FormControlLabel>
                  <FormControlHelper>
                    <FormControlHelperText>
                      {formData.status === 'active' 
                        ? 'El producto está disponible para la venta' 
                        : 'El producto no está disponible para la venta'}
                    </FormControlHelperText>
                  </FormControlHelper>
                </VStack>
                <Switch
                  value={formData.status === 'active'}
                  onValueChange={(value) => handleFieldChange('status', value ? 'active' : 'inactive')}
                />
              </HStack>
            </FormControl>

            {/* Image URL */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>URL de Imagen</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={formData.imageUrl}
                  onChangeText={(value) => handleFieldChange('imageUrl', value)}
                  keyboardType="url"
                />
              </Input>
              <FormControlHelper>
                <FormControlHelperText>
                  URL de la imagen del producto (opcional)
                </FormControlHelperText>
              </FormControlHelper>
            </FormControl>
          </VStack>
        </Card>

        {/* Action Buttons */}
        <HStack space="md" className="pb-4">
          <Button
            variant="outline"
            onPress={onCancel}
            disabled={isFormLoading}
            className="flex-1"
          >
            <Icon as={XIcon} className="w-4 h-4 text-gray-600 mr-2" />
            <ButtonText className="text-gray-600">Cancelar</ButtonText>
          </Button>
          
          <Button
            onPress={handleSubmit}
            disabled={isFormLoading}
            className="flex-1 bg-blue-600 disabled:bg-gray-400"
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
      </VStack>
    </ScrollView>
  );
}