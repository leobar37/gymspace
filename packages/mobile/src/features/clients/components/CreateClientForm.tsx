import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import {
  FormInput,
  FormDatePicker,
  FormSelect,
  FormProvider,
  useForm,
  zodResolver,
} from '@/components/forms';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft } from 'lucide-react-native';
import { useClientsController, ClientFormData } from '../controllers/clients.controller';
import { router } from 'expo-router';
import { Toast, ToastTitle, ToastDescription, useToast } from '@/components/ui/toast';
import { useDocumentTypes, useDocumentValidator } from '@/config/ConfigContext';
import { PhotoField } from '@/features/assets/components/PhotoField';
import { usePrepareAssets } from '@/features/assets/hooks/use-prepare-assets';
import { useGymSdk } from '@/providers/GymSdkProvider';
import type { AssetFieldValue } from '@/features/assets/types/asset-form.types';

// Create the validation schema as a function to use document validator
const createClientSchema = (validateDocument: (type: string, value: string) => { isValid: boolean; error?: string }) => z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  birthDate: z.date().nullable().optional().or(z.undefined()),
  documentValue: z.string().optional().or(z.literal('')).or(z.undefined()),
  documentType: z.string().optional().or(z.undefined()),
  phone: z.string().min(8, 'Teléfono inválido').optional().or(z.literal('')).or(z.undefined()),
  email: z.string().email('Email inválido').optional().or(z.literal('')).or(z.undefined()),
  // address: z.string().min(1, 'La dirección es requerida'), // Not supported by backend yet
  emergencyContactName: z.string().optional().or(z.undefined()),
  emergencyContactPhone: z.string().optional().or(z.undefined()),
  medicalConditions: z.string().optional().or(z.undefined()),
  notes: z.string().optional().or(z.undefined()),
  profilePhotoId: z.any().optional(), // Can be string (existing) or object (pending upload)
}).refine((data) => {
  // If document value is provided, document type must also be provided
  if (data.documentValue && data.documentValue.trim() !== '' && !data.documentType) {
    return false;
  }
  // If both are provided, validate the document
  if (data.documentValue && data.documentType && data.documentValue.trim() !== '') {
    const validation = validateDocument(data.documentType, data.documentValue);
    return validation.isValid;
  }
  return true;
}, {
  message: 'Documento inválido',
  path: ['documentValue'],
});

type ClientFormSchema = {
  name: string;
  birthDate?: Date | null | undefined;
  documentValue?: string | undefined;
  documentType?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  emergencyContactName?: string | undefined;
  emergencyContactPhone?: string | undefined;
  medicalConditions?: string | undefined;
  notes?: string | undefined;
  profilePhotoId?: AssetFieldValue;
};

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
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const isLoading = isCreatingClient || isUpdatingClient || isUploadingPhoto;
  const toast = useToast();
  const documentTypes = useDocumentTypes();
  const validateDocument = useDocumentValidator();
  const { sdk } = useGymSdk();
  const { prepareAssets, state: assetsState } = usePrepareAssets(sdk);
  
  const clientSchema = React.useMemo(
    () => createClientSchema(validateDocument),
    [validateDocument]
  );

  const methods = useForm<ClientFormSchema>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      birthDate: initialData?.birthDate ? new Date(initialData.birthDate) : null,
      documentValue: initialData?.documentValue || initialData?.document || initialData?.documentId || '',
      documentType: initialData?.documentType || (documentTypes.length > 0 ? documentTypes[0].value : ''),
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      // address: initialData?.address || '', // Not supported by backend yet
      emergencyContactName: initialData?.emergencyContactName || '',
      emergencyContactPhone: initialData?.emergencyContactPhone || '',
      medicalConditions: initialData?.medicalConditions || '',
      notes: initialData?.notes || '',
      profilePhotoId: initialData?.profilePhotoId || null,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setIsUploadingPhoto(true);
      
      // Prepare assets (upload photo if it's a new file)
      const result = await prepareAssets(
        data,
        {
          profilePhotoId: {
            description: `Foto de perfil de ${data.name}`,
            metadata: { clientId, type: 'profile' }
          }
        },
        {
          continueOnError: true // Continue even if photo upload fails
        }
      );

      // Convert date to string format for API and ensure required fields
      const formattedData = {
        ...result.values,
        birthDate: data.birthDate ? data.birthDate.toISOString().split('T')[0] : undefined,
        // Make email optional as specified in requirements
        email: data.email || undefined,
        // Clean up optional fields
        documentValue: data.documentValue || undefined,
        documentType: data.documentType || undefined,
        phone: data.phone || undefined,
        emergencyContactName: data.emergencyContactName || undefined,
        emergencyContactPhone: data.emergencyContactPhone || undefined,
        medicalConditions: data.medicalConditions || undefined,
        notes: data.notes || undefined,
        profilePhotoId: result.values.profilePhotoId || undefined,
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
    } catch (error) {
      console.error('Error preparing assets:', error);
      toast.show({
        placement: 'top',
        duration: 4000,
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>
                Error al procesar la imagen. Por favor, inténtalo de nuevo.
              </ToastDescription>
            </Toast>
          );
        },
      });
    } finally {
      setIsUploadingPhoto(false);
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

                <PhotoField
                  name="profilePhotoId"
                  control={methods.control}
                  label="Foto de perfil"
                  description="Opcional: Sube una foto del cliente"
                  aspectRatio={[1, 1]}
                  quality={0.8}
                  allowsEditing={true}
                />

                <FormDatePicker
                  name="birthDate"
                  label="Fecha de nacimiento (opcional)"
                  placeholder="Seleccionar fecha"
                  mode="date"
                  maximumDate={new Date()}
                />

                <FormSelect
                  name="documentType"
                  label="Tipo de documento (opcional)"
                  placeholder="Seleccionar tipo"
                  options={documentTypes.map(dt => ({ 
                    label: dt.label, 
                    value: dt.value 
                  }))}
                />

                <FormInput
                  name="documentValue"
                  label="Número de documento (opcional)"
                  placeholder={documentTypes.find(dt => dt.value === methods.watch('documentType'))?.placeholder || "Ingrese número"}
                  keyboardType="default"
                  returnKeyType="next"
                  maxLength={documentTypes.find(dt => dt.value === methods.watch('documentType'))?.maxLength}
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
                
                <FormInput
                  name="medicalConditions"
                  label="Condiciones médicas (opcional)"
                  placeholder="Alergias, lesiones, medicamentos..."
                  multiline
                  returnKeyType="next"
                />

                <FormInput
                  name="notes"
                  label="Notas (opcional)"
                  placeholder="Información adicional..."
                  multiline
                  returnKeyType="done"
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