import {
  FormDatePicker,
  FormInput,
  FormProvider,
  FormSelect,
  FormTextarea,
  useForm,
  zodResolver,
} from '@/components/forms';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { VStack } from '@/components/ui/vstack';
import { useDocumentTypes, useDocumentValidator } from '@/config/ConfigContext';
import { FileSelector } from '@/features/files/components/FileSelector';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { useLoadingScreen } from '@/shared/loading-screen/useLoadingScreen';
import type { Client, CreateClientDto } from '@gymspace/sdk';
import { router } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { z } from 'zod';
import { useClientsController, type ClientFormData } from '../controllers/clients.controller';

const createClientSchema = (
  validateDocument: (type: string, value: string) => { isValid: boolean; error?: string },
) =>
  z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    birthDate: z.date().nullable().optional().or(z.undefined()),
    documentValue: z.string().optional().or(z.literal('')).or(z.undefined()),
    documentType: z.string().optional().or(z.undefined()),
    phone: z.string().min(8, 'Teléfono inválido').optional().or(z.literal('')).or(z.undefined()),
    email: z.string().email('Email inválido').optional().or(z.literal('')).or(z.undefined()),
    address: z.string().optional().or(z.literal('')).or(z.undefined()),
    gender: z.string().optional().or(z.literal('')).or(z.undefined()),
    maritalStatus: z.string().optional().or(z.literal('')).or(z.undefined()),
    city: z.string().optional().or(z.literal('')).or(z.undefined()),
    state: z.string().optional().or(z.literal('')).or(z.undefined()),
    postalCode: z.string().optional().or(z.literal('')).or(z.undefined()),
    occupation: z.string().optional().or(z.literal('')).or(z.undefined()),
    notes: z.string().optional().or(z.undefined()),
    profilePhotoId: z.string().nullable().optional(),
    customData: z.record(z.any()).optional(),
  });

type ClientFormSchema = ClientFormData;

interface CreateClientFormProps {
  initialData?: Client; // API response data
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
  const documentTypes = useDocumentTypes();
  const validateDocument = useDocumentValidator();
  const { execute } = useLoadingScreen();

  const clientSchema = React.useMemo(
    () => createClientSchema(validateDocument),
    [validateDocument],
  );

  const getDefaultFormValues = (): ClientFormData => ({
    name: '',
    email: '',
    phone: '',
    documentValue: '',
    documentType: documentTypes.length > 0 ? documentTypes[0].value : '',
    birthDate: null,
    gender: '',
    maritalStatus: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    occupation: '',
    notes: '',
    profilePhotoId: null,
    customData: {},
  });

  const mapClientToFormData = (client: Client): ClientFormData => ({
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    documentValue: client.documentValue || '',
    documentType: client.documentType || (documentTypes.length > 0 ? documentTypes[0].value : ''),
    birthDate: client.birthDate ? new Date(client.birthDate) : null,
    gender: client.gender || '',
    maritalStatus: client.maritalStatus || '',
    address: client.address || '',
    city: client.city || '',
    state: client.state || '',
    postalCode: client.postalCode || '',
    occupation: client.occupation || '',
    notes: client.notes || '',
    profilePhotoId: client.profilePhotoId || null,
    customData: client.customData || {},
  });

  const methods = useForm<ClientFormSchema>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: initialData ? mapClientToFormData(initialData) : getDefaultFormValues(),
  });

  const onSubmit = async (data: ClientFormSchema) => {
    // Map form data to DTO inline
    const mapFormDataToDto = (formData: ClientFormData): CreateClientDto => {
      const formatDateForAPI = (date: Date | string | null | undefined): string | undefined => {
        if (!date) return undefined;
        if (typeof date === 'string') return date;
        return date.toISOString().split('T')[0];
      };
      const sanitizeField = (value: string | undefined): string | undefined => {
        return value && value.trim() !== '' ? value.trim() : undefined;
      };
      return {
        name: formData.name.trim(),
        email: sanitizeField(formData.email),
        phone: sanitizeField(formData.phone),
        documentValue: sanitizeField(formData.documentValue),
        documentType: sanitizeField(formData.documentType),
        birthDate: formatDateForAPI(formData.birthDate),
        gender: sanitizeField(formData.gender),
        maritalStatus: sanitizeField(formData.maritalStatus),
        address: formData.address?.trim() || '',
        city: sanitizeField(formData.city),
        state: sanitizeField(formData.state),
        postalCode: sanitizeField(formData.postalCode),
        occupation: sanitizeField(formData.occupation),
        notes: sanitizeField(formData.notes),
        profilePhotoId: formData.profilePhotoId || undefined,
        customData: formData.customData,
      };
    };

    const dtoData = mapFormDataToDto(data);

    const extractErrorMessage = (error: any): string => {
      if (error?.response?.data?.message) {
        return error.response.data.message;
      }
      if (error?.message) {
        return error.message;
      }
      return isEditing ? 'No se pudo actualizar el cliente' : 'No se pudo crear el cliente';
    };

    const promise = new Promise<void>((resolve, reject) => {
      if (isEditing && clientId) {
        updateClient(
          { id: clientId, data: dtoData as any }, // UpdateClientDto has all fields optional
          {
            onSuccess: () => {
              resolve();
            },
            onError: (error) => {
              console.error('Update client error:', error);
              reject(error);
            },
          },
        );
      } else {
        createClient(dtoData, {
          onSuccess: () => {
            resolve();
          },
          onError: (error) => {
            console.error('Create client error:', error);
            reject(error);
          },
        });
      }
    });

    await execute(promise, {
      action: isEditing ? 'Actualizando cliente...' : 'Creando cliente...',
      successMessage: isEditing
        ? 'Los datos del cliente se actualizaron correctamente'
        : 'El cliente se registró correctamente',
      errorFormatter: extractErrorMessage,
      hideOnSuccess: true,
      hideDelay: 1500,
      onSuccess: () => {
        router.back();
      },
    });
  };

  const { isValid, isDirty, errors } = methods.formState;

  console.log(
    'Form errors:',
    JSON.stringify(
      {
        isValid,
        isDirty,
        errors,
      },
      null,
      3,
    ),
  );

  const isFormDisabled = isLoading || !isValid;

  const actions = (
    <Button
      onPress={methods.handleSubmit(onSubmit)}
      isDisabled={isFormDisabled}
      size="lg"
      action="primary"
      variant="solid"
      className="w-full"
    >
      {isLoading ? (
        <>
          <ButtonSpinner />
          <ButtonText>{isEditing ? 'Actualizando...' : 'Creando...'}</ButtonText>
        </>
      ) : (
        <ButtonText>{isEditing ? 'Actualizar Cliente' : 'Crear Cliente'}</ButtonText>
      )}
    </Button>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <FormProvider {...methods}>
        <ScreenForm
          showBackButton={false}
          showFixedFooter={true}
          useSafeArea={false}
          footerContent={actions}
        >
          <VStack className="gap-6">
            <VStack className="gap-4">
              <Heading className="text-xl font-bold text-gray-900">Información Personal</Heading>
              <FormInput
                name="name"
                label="Nombre completo"
                placeholder="Juan Pérez"
                autoFocus
                returnKeyType="next"
              />

              <FileSelector name="profilePhotoId" label="Foto de perfil" />

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
                options={documentTypes.map((dt) => ({
                  label: dt.label,
                  value: dt.value,
                }))}
              />

              <FormInput
                name="documentValue"
                label="Número de documento (opcional)"
                placeholder={
                  documentTypes.find((dt) => dt.value === methods.watch('documentType'))
                    ?.placeholder || 'Ingrese número'
                }
                keyboardType="default"
                returnKeyType="next"
                maxLength={
                  documentTypes.find((dt) => dt.value === methods.watch('documentType'))?.maxLength
                }
              />
            </VStack>

            <Divider />
            <VStack className="gap-4">
              <Heading className="text-xl font-bold text-gray-900">Información de Contacto</Heading>

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
                label="Dirección (opcional)"
                placeholder="Av. Principal 123, Distrito"
                returnKeyType="next"
              />

              <FormInput
                name="city"
                label="Ciudad (opcional)"
                placeholder="Lima"
                returnKeyType="next"
              />

              <FormInput
                name="state"
                label="Estado/Región (opcional)"
                placeholder="Lima"
                returnKeyType="next"
              />

              <FormInput
                name="postalCode"
                label="Código postal (opcional)"
                placeholder="15001"
                keyboardType="numeric"
                returnKeyType="next"
              />
            </VStack>

            <Divider />
            <VStack className="gap-4">
              <Heading className="text-xl font-bold text-gray-900">
                Información Personal Adicional
              </Heading>

              <FormSelect
                name="gender"
                label="Género (opcional)"
                placeholder="Seleccionar género"
                options={[
                  { label: 'Masculino', value: 'male' },
                  { label: 'Femenino', value: 'female' },
                  { label: 'Otro', value: 'other' },
                  { label: 'Prefiero no decir', value: 'prefer_not_to_say' },
                ]}
              />

              <FormSelect
                name="maritalStatus"
                label="Estado civil (opcional)"
                placeholder="Seleccionar estado civil"
                options={[
                  { label: 'Soltero/a', value: 'single' },
                  { label: 'Casado/a', value: 'married' },
                  { label: 'Divorciado/a', value: 'divorced' },
                  { label: 'Viudo/a', value: 'widowed' },
                  { label: 'Unión libre', value: 'domestic_partnership' },
                ]}
              />
              <FormInput
                name="occupation"
                label="Ocupación (opcional)"
                placeholder="Ingeniero, Médico, Estudiante..."
                returnKeyType="next"
              />
            </VStack>
            <Divider />
            <VStack className="gap-4">
              <Heading className="text-xl font-bold text-gray-900">Notas</Heading>
              <FormTextarea
                name="notes"
                label="Notas adicionales (opcional)"
                placeholder="Información adicional, observaciones, preferencias..."
                returnKeyType="done"
                numberOfLines={4}
                maxLength={500}
              />
            </VStack>
          </VStack>
        </ScreenForm>
      </FormProvider>
    </KeyboardAvoidingView>
  );
};
