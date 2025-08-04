import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import {
  FormInput,
  FormTextarea,
  FormProvider,
  useForm,
  zodResolver,
} from '@/components/forms';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { useClientsController, ClientFormData } from '../controllers/clients.controller';
import { router } from 'expo-router';
import { showToast } from '@/components/ui/toast';

// Validation schema
const clientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: AAAA-MM-DD').optional().or(z.literal('')),
  document: z.string().min(6, 'Documento inválido').optional().or(z.literal('')),
  phone: z.string().min(8, 'Teléfono inválido').optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().min(1, 'La dirección es requerida'),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalConditions: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormSchema = z.infer<typeof clientSchema>;

interface CreateClientFormProps {
  initialData?: Partial<ClientFormData>;
  isEditing?: boolean;
  clientId?: string;
}

export const CreateClientForm: React.FC<CreateClientFormProps> = ({
  initialData,
  isEditing = false,
  clientId,
}) => {
  const { createClient, updateClient, isCreatingClient, isUpdatingClient } = useClientsController();
  const isLoading = isCreatingClient || isUpdatingClient;

  const methods = useForm<ClientFormSchema>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initialData?.name || '',
      birthDate: initialData?.birthDate || '',
      document: initialData?.document || initialData?.documentId || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      emergencyContactName: initialData?.emergencyContactName || '',
      emergencyContactPhone: initialData?.emergencyContactPhone || '',
      medicalConditions: initialData?.medicalConditions || '',
      notes: initialData?.notes || '',
    },
  });

  const onSubmit = async (data: ClientFormSchema) => {
    try {
      if (isEditing && clientId) {
        updateClient(
          { id: clientId, data },
          {
            onSuccess: () => {
              showToast({
                title: 'Cliente actualizado',
                description: 'Los datos del cliente se actualizaron correctamente',
                action: 'success',
              });
              router.back();
            },
            onError: (error) => {
              showToast({
                title: 'Error',
                description: 'No se pudo actualizar el cliente',
                action: 'error',
              });
            },
          }
        );
      } else {
        createClient(data as ClientFormData, {
          onSuccess: () => {
            showToast({
              title: 'Cliente creado',
              description: 'El cliente se registró correctamente',
              action: 'success',
            });
            router.back();
          },
          onError: (error) => {
            showToast({
              title: 'Error',
              description: 'No se pudo crear el cliente',
              action: 'error',
            });
          },
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 p-4">
          <FormProvider {...methods}>
            <VStack className="gap-6">
              {/* Personal Information */}
              <VStack className="gap-4">
                <Heading className="text-xl font-bold text-gray-900">
                  Información Personal
                </Heading>
                
                <FormInput
                  name="name"
                  label="Nombre completo"
                  placeholder="Juan Pérez"
                  autoFocus
                  returnKeyType="next"
                />

                <FormInput
                  name="birthDate"
                  label="Fecha de nacimiento (opcional)"
                  placeholder="1990-01-31"
                  keyboardType="numeric"
                  returnKeyType="next"
                />

                <FormInput
                  name="document"
                  label="Documento de identidad (opcional)"
                  placeholder="12345678"
                  keyboardType="numeric"
                  returnKeyType="next"
                />
              </VStack>

              <Divider />

              {/* Contact Information */}
              <VStack className="gap-4">
                <Heading className="text-xl font-bold text-gray-900">
                  Información de Contacto
                </Heading>
                
                <FormInput
                  name="phone"
                  label="Teléfono (opcional)"
                  placeholder="+51 999 999 999"
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />

                <FormInput
                  name="email"
                  label="Email (opcional)"
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />

                <FormInput
                  name="address"
                  label="Dirección"
                  placeholder="Av. Principal 123, Distrito"
                  returnKeyType="next"
                />
              </VStack>

              <Divider />

              {/* Emergency Contact */}
              <VStack className="gap-4">
                <Heading className="text-xl font-bold text-gray-900">
                  Contacto de Emergencia
                </Heading>
                
                <FormInput
                  name="emergencyContactName"
                  label="Nombre (opcional)"
                  placeholder="María García"
                  returnKeyType="next"
                />

                <FormInput
                  name="emergencyContactPhone"
                  label="Teléfono (opcional)"
                  placeholder="+51 888 888 888"
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
              </VStack>

              <Divider />

              {/* Additional Information */}
              <VStack className="gap-4">
                <Heading className="text-xl font-bold text-gray-900">
                  Información Adicional
                </Heading>
                
                <FormTextarea
                  name="medicalConditions"
                  label="Condiciones médicas (opcional)"
                  placeholder="Alergias, lesiones, medicamentos..."
                  numberOfLines={3}
                  maxLength={500}
                />

                <FormTextarea
                  name="notes"
                  label="Notas (opcional)"
                  placeholder="Información adicional..."
                  numberOfLines={3}
                  maxLength={500}
                />
              </VStack>

              {/* Submit button */}
              <Button
                onPress={methods.handleSubmit(onSubmit)}
                disabled={isLoading}
                className="w-full py-3 px-6 bg-blue-600 rounded-lg mt-6"
              >
                {isLoading ? (
                  <>
                    <ButtonSpinner className="text-white" />
                    <ButtonText className="text-white font-semibold ml-2">
                      {isEditing ? 'Actualizando...' : 'Creando...'}
                    </ButtonText>
                  </>
                ) : (
                  <ButtonText className="text-white font-semibold text-center">
                    {isEditing ? 'Actualizar Cliente' : 'Crear Cliente'}
                  </ButtonText>
                )}
              </Button>
            </VStack>
          </FormProvider>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};