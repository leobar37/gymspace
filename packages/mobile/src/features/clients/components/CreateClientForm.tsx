import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import {
  FormInput,
  FormTextarea,
  FormDatePicker,
  FormProvider,
  useForm,
  zodResolver,
} from '@/components/forms';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft } from 'lucide-react-native';
import { useClientsController, ClientFormData } from '../controllers/clients.controller';
import { router } from 'expo-router';
import { Toast, ToastTitle, ToastDescription, useToast } from '@/components/ui/toast';

// Validation schema
const clientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  birthDate: z.date().nullable().optional(),
  document: z.string().min(6, 'Documento inválido').optional().or(z.literal('')),
  phone: z.string().min(8, 'Teléfono inválido').optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  // address: z.string().min(1, 'La dirección es requerida'), // Not supported by backend yet
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
  const toast = useToast();

  const methods = useForm<ClientFormSchema>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initialData?.name || '',
      birthDate: initialData?.birthDate ? new Date(initialData.birthDate) : null,
      document: initialData?.document || initialData?.documentId || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      // address: initialData?.address || '', // Not supported by backend yet
      emergencyContactName: initialData?.emergencyContactName || '',
      emergencyContactPhone: initialData?.emergencyContactPhone || '',
      medicalConditions: initialData?.medicalConditions || '',
      notes: initialData?.notes || '',
    },
  });

  const onSubmit = (data: ClientFormSchema) => {
    // Convert date to string format for API and ensure required fields
    const formattedData = {
      ...data,
      birthDate: data.birthDate ? data.birthDate.toISOString().split('T')[0] : undefined,
      // Ensure email is always a string (required by API)
      email: data.email || '',
      // Clean up optional fields
      document: data.document || undefined,
      phone: data.phone || undefined,
      emergencyContactName: data.emergencyContactName || undefined,
      emergencyContactPhone: data.emergencyContactPhone || undefined,
      medicalConditions: data.medicalConditions || undefined,
      notes: data.notes || undefined,
    };

    if (isEditing && clientId) {
      updateClient(
        { id: clientId, data: formattedData },
        {
          onSuccess: () => {
            toast.show({
              placement: 'top',
              duration: 3000,
              render: ({ id }) => {
                return (
                  <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                    <ToastTitle>Cliente actualizado</ToastTitle>
                    <ToastDescription>
                      Los datos del cliente se actualizaron correctamente
                    </ToastDescription>
                  </Toast>
                );
              },
            });
            router.back();
          },
          onError: (error) => {
            console.error('Update client error:', error);
            toast.show({
              placement: 'top',
              duration: 4000,
              render: ({ id }) => {
                return (
                  <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                    <ToastTitle>Error</ToastTitle>
                    <ToastDescription>
                      No se pudo actualizar el cliente
                    </ToastDescription>
                  </Toast>
                );
              },
            });
          },
        }
      );
    } else {
      createClient(formattedData as ClientFormData, {
        onSuccess: () => {
          toast.show({
            placement: 'top',
            duration: 3000,
            render: ({ id }) => {
              return (
                <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                  <ToastTitle>Cliente creado</ToastTitle>
                  <ToastDescription>
                    El cliente se registró correctamente
                  </ToastDescription>
                </Toast>
              );
            },
          });
          router.back();
        },
        onError: (error) => {
          console.error('Create client error:', error);
          toast.show({
            placement: 'top',
            duration: 4000,
            render: ({ id }) => {
              return (
                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                  <ToastTitle>Error</ToastTitle>
                  <ToastDescription>
                    No se pudo crear el cliente
                  </ToastDescription>
                </Toast>
              );
            },
          });
        },
      });
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
              {/* Back Button and Title */}
              <HStack className="items-center gap-2 mb-2">
                <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                  <Icon as={ChevronLeft} className="text-gray-600" size="xl" />
                </Pressable>
                <Heading className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                </Heading>
              </HStack>

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

                <FormDatePicker
                  name="birthDate"
                  label="Fecha de nacimiento (opcional)"
                  placeholder="Seleccionar fecha"
                  mode="date"
                  maximumDate={new Date()}
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
                size="lg"
                action="primary"
                variant="solid"
                className="w-full mt-6"
              >
                {isLoading ? (
                  <>
                    <ButtonSpinner />
                    <ButtonText>
                      {isEditing ? 'Actualizando...' : 'Creando...'}
                    </ButtonText>
                  </>
                ) : (
                  <ButtonText>
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