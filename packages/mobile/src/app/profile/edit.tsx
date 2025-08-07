import React, { useState, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormControl, FormControlLabel, FormControlLabelText, FormControlError, FormControlErrorText } from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { useProfileController } from '@/controllers/profile.controller';
import { UpdateProfileDto } from '@gymspace/sdk';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, UserIcon, PhoneIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditProfileScreen() {
  const {
    profile,
    isLoadingProfile,
    updateProfile,
    isUpdatingProfile,
    isUpdateSuccess,
  } = useProfileController();

  const [formData, setFormData] = useState<UpdateProfileDto>({
    name: '',
    phone: '',
    birthDate: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        birthDate: profile.birthDate ? 
          (typeof profile.birthDate === 'string' ? profile.birthDate : format(profile.birthDate, 'yyyy-MM-dd')) 
          : undefined,
      });
      
      if (profile.birthDate) {
        const date = typeof profile.birthDate === 'string' ? parseISO(profile.birthDate) : profile.birthDate;
        setSelectedDate(date);
      }
    }
  }, [profile]);

  // Navigate back on successful update
  useEffect(() => {
    if (isUpdateSuccess) {
      router.back();
    }
  }, [isUpdateSuccess]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Número de teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      updateProfile(formData);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setFormData({
        ...formData,
        birthDate: format(date, 'yyyy-MM-dd'),
      });
    }
  };

  if (isLoadingProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ButtonSpinner />
        <Text className="mt-2 text-gray-600">Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Editar Perfil',
          headerBackTitle: 'Atrás',
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-50"
      >
        <ScrollView className="flex-1">
          <VStack className="p-4 gap-4">
            {/* Personal Information Card */}
            <Card className="p-4">
              <VStack className="gap-4">
                <Text className="text-lg font-semibold text-gray-900">
                  Información Personal
                </Text>
                
                {/* Name Field */}
                <FormControl isInvalid={!!errors.name}>
                  <FormControlLabel>
                    <HStack className="items-center gap-2">
                      <Icon as={UserIcon} className="w-4 h-4 text-gray-500" />
                      <FormControlLabelText>Nombre completo</FormControlLabelText>
                    </HStack>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      value={formData.name}
                      onChangeText={(text) => {
                        setFormData({ ...formData, name: text });
                        if (errors.name) {
                          setErrors({ ...errors, name: '' });
                        }
                      }}
                      placeholder="Ingresa tu nombre completo"
                      autoCapitalize="words"
                    />
                  </Input>
                  {errors.name && (
                    <FormControlError>
                      <FormControlErrorText>{errors.name}</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>

                {/* Phone Field */}
                <FormControl isInvalid={!!errors.phone}>
                  <FormControlLabel>
                    <HStack className="items-center gap-2">
                      <Icon as={PhoneIcon} className="w-4 h-4 text-gray-500" />
                      <FormControlLabelText>Número de teléfono</FormControlLabelText>
                    </HStack>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      value={formData.phone || ''}
                      onChangeText={(text) => {
                        setFormData({ ...formData, phone: text });
                        if (errors.phone) {
                          setErrors({ ...errors, phone: '' });
                        }
                      }}
                      placeholder="+1234567890"
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                    />
                  </Input>
                  {errors.phone && (
                    <FormControlError>
                      <FormControlErrorText>{errors.phone}</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>

                {/* Birth Date Field */}
                <FormControl>
                  <FormControlLabel>
                    <HStack className="items-center gap-2">
                      <Icon as={CalendarIcon} className="w-4 h-4 text-gray-500" />
                      <FormControlLabelText>Fecha de nacimiento</FormControlLabelText>
                    </HStack>
                  </FormControlLabel>
                  <Button
                    variant="outline"
                    onPress={() => setShowDatePicker(true)}
                    className="justify-start"
                  >
                    <ButtonText className="text-gray-900">
                      {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Seleccionar fecha'}
                    </ButtonText>
                  </Button>
                </FormControl>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}
              </VStack>
            </Card>

            {/* Account Information Card (Read-only) */}
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
                
                <Text className="text-xs text-gray-500 italic mt-2">
                  El correo electrónico no se puede cambiar desde aquí
                </Text>
              </VStack>
            </Card>

            {/* Action Buttons */}
            <VStack className="gap-3 mt-4">
              <Button
                onPress={handleSubmit}
                isDisabled={isUpdatingProfile}
                className="w-full"
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
                onPress={() => router.back()}
                isDisabled={isUpdatingProfile}
                className="w-full"
              >
                <ButtonText>Cancelar</ButtonText>
              </Button>
            </VStack>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}