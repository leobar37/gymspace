import React, { useEffect, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useProfileController } from '@/controllers/profile.controller';
import { UpdateProfileDto } from '@gymspace/sdk';
import { format, parseISO } from 'date-fns';
import { UserIcon, PhoneIcon, CalendarIcon, EditIcon, XIcon, LockIcon } from 'lucide-react-native';
import {
  FormProvider,
  FormInput,
  FormDatePicker,
  useForm,
  zodResolver,
} from '@/components/forms';
import { z } from 'zod';

// Validation schema
const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-()]+$/.test(val),
      'Número de teléfono inválido'
    ),
  birthDate: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfileScreen() {
  const {
    profile,
    isLoadingProfile,
    updateProfile,
    isUpdatingProfile,
    isUpdateSuccess,
  } = useProfileController();

  const [isEditMode, setIsEditMode] = useState(false);

  // Initialize form
  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      birthDate: undefined,
    },
    mode: 'onChange',
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      methods.reset({
        name: profile.name || '',
        phone: profile.phone || '',
        birthDate: profile.birthDate ? 
          (typeof profile.birthDate === 'string' ? profile.birthDate : format(profile.birthDate, 'yyyy-MM-dd')) 
          : undefined,
      });
    }
  }, [profile, methods]);

  // Navigate back on successful update
  useEffect(() => {
    if (isUpdateSuccess) {
      setIsEditMode(false);
    }
  }, [isUpdateSuccess]);

  const handleSubmit = (data: ProfileFormData) => {
    const updateData: UpdateProfileDto = {
      name: data.name,
      phone: data.phone || undefined,
      birthDate: data.birthDate || undefined,
    };
    updateProfile(updateData);
  };

  const handleCancel = () => {
    // Reset form to original values
    if (profile) {
      methods.reset({
        name: profile.name || '',
        phone: profile.phone || '',
        birthDate: profile.birthDate ? 
          (typeof profile.birthDate === 'string' ? profile.birthDate : format(profile.birthDate, 'yyyy-MM-dd')) 
          : undefined,
      });
    }
    setIsEditMode(false);
  };

  if (isLoadingProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ButtonSpinner />
        <Text className="mt-2 text-gray-600">Cargando perfil...</Text>
      </View>
    );
  }

  const formatBirthDate = (birthDate: any) => {
    if (!birthDate) return 'No especificada';
    const date = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
    return format(date, 'dd/MM/yyyy');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? 'Editar Perfil' : 'Mi Perfil',
          headerBackTitle: 'Atrás',
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-50"
      >
        <ScrollView 
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <VStack className="p-4 gap-4">
            {!isEditMode ? (
              // View Mode - Read Only
              <>
                {/* Personal Information Card */}
                <Card className="p-4">
                  <VStack className="gap-4">
                    <HStack className="items-center justify-between">
                      <Text className="text-lg font-semibold text-gray-900">
                        Información Personal
                      </Text>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => setIsEditMode(true)}
                      >
                        <Icon as={EditIcon} className="w-4 h-4 mr-1" />
                        <ButtonText>Editar</ButtonText>
                      </Button>
                    </HStack>
                    
                    <VStack className="gap-4">
                      {/* Name */}
                      <VStack className="gap-1">
                        <HStack className="items-center gap-2">
                          <Icon as={UserIcon} className="w-4 h-4 text-gray-500" />
                          <Text className="text-sm text-gray-500">Nombre completo</Text>
                        </HStack>
                        <Text className="text-gray-900 text-base ml-6">
                          {profile?.name || 'No especificado'}
                        </Text>
                      </VStack>

                      {/* Phone */}
                      <VStack className="gap-1">
                        <HStack className="items-center gap-2">
                          <Icon as={PhoneIcon} className="w-4 h-4 text-gray-500" />
                          <Text className="text-sm text-gray-500">Número de teléfono</Text>
                        </HStack>
                        <Text className="text-gray-900 text-base ml-6">
                          {profile?.phone || 'No especificado'}
                        </Text>
                      </VStack>

                      {/* Birth Date */}
                      <VStack className="gap-1">
                        <HStack className="items-center gap-2">
                          <Icon as={CalendarIcon} className="w-4 h-4 text-gray-500" />
                          <Text className="text-sm text-gray-500">Fecha de nacimiento</Text>
                        </HStack>
                        <Text className="text-gray-900 text-base ml-6">
                          {formatBirthDate(profile?.birthDate)}
                        </Text>
                      </VStack>
                    </VStack>
                  </VStack>
                </Card>

                {/* Account Information Card */}
                <Card className="p-4">
                  <VStack className="gap-4">
                    <Text className="text-lg font-semibold text-gray-900">
                      Información de Cuenta
                    </Text>
                    
                    <VStack className="gap-3">
                      <VStack>
                        <Text className="text-sm text-gray-500">Correo electrónico</Text>
                        <Text className="text-gray-900">{profile?.email}</Text>
                      </VStack>
                      
                      <VStack>
                        <Text className="text-sm text-gray-500">Tipo de cuenta</Text>
                        <Text className="text-gray-900">
                          {profile?.userType === 'owner' ? 'Propietario' : 'Colaborador'}
                        </Text>
                      </VStack>
                      
                      <VStack>
                        <Text className="text-sm text-gray-500">Estado de verificación</Text>
                        <Text className={profile?.emailVerified ? 'text-green-600' : 'text-orange-600'}>
                          {profile?.emailVerified ? 'Verificado' : 'Pendiente de verificación'}
                        </Text>
                      </VStack>
                      
                      <VStack>
                        <Text className="text-sm text-gray-500">Miembro desde</Text>
                        <Text className="text-gray-900">
                          {profile?.createdAt && format(
                            typeof profile.createdAt === 'string' ? parseISO(profile.createdAt) : profile.createdAt,
                            'dd/MM/yyyy'
                          )}
                        </Text>
                      </VStack>
                    </VStack>

                    {/* Change Password Button */}
                    <Button
                      variant="outline"
                      size="md"
                      onPress={() => router.push('/profile/change-password')}
                      className="w-full mt-2"
                    >
                      <Icon as={LockIcon} className="w-4 h-4 mr-2" />
                      <ButtonText>Cambiar Contraseña</ButtonText>
                    </Button>
                  </VStack>
                </Card>
              </>
            ) : (
              // Edit Mode - Form
              <FormProvider {...methods}>
                {/* Personal Information Card - Edit Mode */}
                <Card className="p-4">
                  <VStack className="gap-4">
                    <HStack className="items-center justify-between">
                      <Text className="text-lg font-semibold text-gray-900">
                        Información Personal
                      </Text>
                      <Button
                        variant="link"
                        size="sm"
                        onPress={handleCancel}
                      >
                        <Icon as={XIcon} className="w-4 h-4 mr-1" />
                        <ButtonText>Cancelar</ButtonText>
                      </Button>
                    </HStack>
                    
                    {/* Name Field */}
                    <FormInput
                      name="name"
                      label="Nombre completo"
                      placeholder="Ingresa tu nombre completo"
                      autoCapitalize="words"
                      leftIcon={<Icon as={UserIcon} className="w-4 h-4 text-gray-500" />}
                    />

                    {/* Phone Field */}
                    <FormInput
                      name="phone"
                      label="Número de teléfono"
                      placeholder="+1234567890"
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      leftIcon={<Icon as={PhoneIcon} className="w-4 h-4 text-gray-500" />}
                    />

                    {/* Birth Date Field */}
                    <FormDatePicker
                      name="birthDate"
                      label="Fecha de nacimiento"
                      placeholder="Seleccionar fecha"
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 0, 1)}
                    />
                  </VStack>
                </Card>

                {/* Account Information Card - Still Read Only in Edit Mode */}
                <Card className="p-4">
                  <VStack className="gap-4">
                    <Text className="text-lg font-semibold text-gray-900">
                      Información de Cuenta
                    </Text>
                    
                    <VStack className="gap-3">
                      <VStack>
                        <Text className="text-sm text-gray-500">Correo electrónico</Text>
                        <Text className="text-gray-900">{profile?.email}</Text>
                      </VStack>
                      
                      <VStack>
                        <Text className="text-sm text-gray-500">Tipo de cuenta</Text>
                        <Text className="text-gray-900">
                          {profile?.userType === 'owner' ? 'Propietario' : 'Colaborador'}
                        </Text>
                      </VStack>
                    </VStack>
                    
                    <Text className="text-xs text-gray-500 italic mt-2">
                      El correo electrónico y tipo de cuenta no se pueden cambiar
                    </Text>
                  </VStack>
                </Card>

                {/* Action Buttons - Edit Mode */}
                <VStack className="gap-3 mt-4 pb-safe">
                  <Button
                    onPress={methods.handleSubmit(handleSubmit)}
                    isDisabled={isUpdatingProfile || !methods.formState.isValid}
                    className="w-full"
                    variant="solid"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <ButtonSpinner />
                        <ButtonText className="ml-2">Guardando...</ButtonText>
                      </>
                    ) : (
                      <ButtonText>Guardar Cambios</ButtonText>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onPress={handleCancel}
                    isDisabled={isUpdatingProfile}
                    className="w-full"
                  >
                    <ButtonText>Cancelar</ButtonText>
                  </Button>
                </VStack>
              </FormProvider>
            )}
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
      
    </>
  );
}