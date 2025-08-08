import React, { useState } from 'react';
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
import { FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText, FormControlError, FormControlErrorText } from '@/components/ui/form-control';
import { 
  SaveIcon, 
  XIcon
} from 'lucide-react-native';
import type { Supplier, CreateSupplierDto, UpdateSupplierDto } from '@gymspace/sdk';

interface SupplierFormProps {
  supplier?: Supplier;
  onSubmit: (data: CreateSupplierDto | UpdateSupplierDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  contactInfo: string;
  phone: string;
  email: string;
  address: string;
}

interface FormErrors {
  name?: string;
  contactInfo?: string;
  phone?: string;
  email?: string;
}

export function SupplierForm({ supplier, onSubmit, onCancel, isLoading = false }: SupplierFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: supplier?.name || '',
    contactInfo: supplier?.contactInfo || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Basic phone validation - at least 6 digits
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    const digitsOnly = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && digitsOnly.length >= 6;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proveedor es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.contactInfo.trim()) {
      newErrors.contactInfo = 'La información de contacto es requerida';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'El teléfono no es válido';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
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
      const data: CreateSupplierDto | UpdateSupplierDto = {
        name: formData.name.trim(),
        contactInfo: formData.contactInfo.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
      };

      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting supplier form:', error);
      Alert.alert(
        'Error',
        'No se pudo guardar el proveedor. Por favor intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for the field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <VStack space="lg" className="p-4">
        {/* Basic Information */}
        <Card className="bg-white border border-gray-200">
          <VStack space="md" className="p-4">
            <Text className="text-lg font-semibold text-gray-900">
              Información del Proveedor
            </Text>

            {/* Supplier Name */}
            <FormControl isInvalid={!!errors.name}>
              <FormControlLabel>
                <FormControlLabelText>Nombre del Proveedor *</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  placeholder="Ej: Distribuidora ABC"
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

            {/* Contact Info */}
            <FormControl isInvalid={!!errors.contactInfo}>
              <FormControlLabel>
                <FormControlLabelText>Información de Contacto *</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  placeholder="Ej: Juan Pérez - Gerente de Ventas"
                  value={formData.contactInfo}
                  onChangeText={(value) => handleFieldChange('contactInfo', value)}
                />
              </Input>
              {errors.contactInfo && (
                <FormControlError>
                  <FormControlErrorText>{errors.contactInfo}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>
          </VStack>
        </Card>

        {/* Contact Information */}
        <Card className="bg-white border border-gray-200">
          <VStack space="md" className="p-4">
            <Text className="text-lg font-semibold text-gray-900">
              Información de Contacto
            </Text>

            {/* Phone */}
            <FormControl isInvalid={!!errors.phone}>
              <FormControlLabel>
                <FormControlLabelText>Teléfono *</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  placeholder="Ej: +51 999 999 999"
                  value={formData.phone}
                  onChangeText={(value) => handleFieldChange('phone', value)}
                  keyboardType="phone-pad"
                />
              </Input>
              {errors.phone && (
                <FormControlError>
                  <FormControlErrorText>{errors.phone}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Email */}
            <FormControl isInvalid={!!errors.email}>
              <FormControlLabel>
                <FormControlLabelText>Correo Electrónico</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  placeholder="Ej: contacto@proveedor.com"
                  value={formData.email}
                  onChangeText={(value) => handleFieldChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Input>
              {errors.email && (
                <FormControlError>
                  <FormControlErrorText>{errors.email}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Address */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Dirección</FormControlLabelText>
              </FormControlLabel>
              <Textarea>
                <TextareaInput
                  placeholder="Dirección completa del proveedor"
                  value={formData.address}
                  onChangeText={(value) => handleFieldChange('address', value)}
                  numberOfLines={3}
                />
              </Textarea>
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
                  {supplier ? 'Actualizar' : 'Crear'} Proveedor
                </ButtonText>
              </HStack>
            )}
          </Button>
        </HStack>
      </VStack>
    </ScrollView>
  );
}