import React, { useState } from 'react';
import { SafeAreaView, View, ScrollView, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { 
  VStack, 
  HStack,
  Heading, 
  Text, 
  GluestackButton as Button, 
  ButtonText,
  Icon,
  Progress,
  Box,
  Card,
  Center
} from '../../../components/ui';
import { 
  useForm, 
  FormProvider, 
  FormInput,
  FormTextarea,
  zodResolver
} from '../../../components/forms';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon, CameraIcon, ImageIcon } from 'lucide-react-native';
import { useOnboardingStore } from '../../../store/onboarding';

// Validation schema
const gymSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  phone: z.string().min(8, 'Número de teléfono inválido'),
  description: z.string().optional(),
});

type GymForm = z.infer<typeof gymSchema>;

export default function CreateGymScreen() {
  const { setGymData } = useOnboardingStore();
  const [logo, setLogo] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);

  // Initialize form
  const methods = useForm<GymForm>({
    resolver: zodResolver(gymSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      description: '',
    },
  });

  const pickImage = async (type: 'logo' | 'cover') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'logo') {
        setLogo(result.assets[0].uri);
      } else {
        setCoverPhoto(result.assets[0].uri);
      }
    }
  };

  const onSubmit = (data: GymForm) => {
    setGymData({
      name: data.name,
      address: data.address,
      phone: data.phone,
      description: data.description,
      logo: logo || undefined,
      coverPhoto: coverPhoto || undefined,
    });
    router.push('/(onboarding)/owner/welcome');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-4">
            {/* Header */}
            <HStack className="items-center justify-between mb-6">
              <Pressable onPress={() => router.back()}>
                <Icon as={ChevronLeftIcon} className="text-gray-700 w-6 h-6" />
              </Pressable>
              <Text className="text-gray-600">Paso 5 de 7</Text>
            </HStack>

            {/* Progress bar */}
            <Box className="mb-8">
              <Progress value={70} className="h-2 bg-gray-200 rounded-full" />
            </Box>

            <VStack className="flex-1 gap-12">
              {/* Title */}
              <VStack className="gap-3">
                <Heading className="text-gray-900 text-2xl font-bold">
                  Crear tu primer gimnasio
                </Heading>
                <Text className="text-gray-600 text-lg">
                  Agrega la información de tu gimnasio
                </Text>
              </VStack>

              {/* Form */}
              <FormProvider {...methods}>
                <VStack className="gap-6">
                  {/* Image uploads */}
                  <VStack className="gap-4">
                    {/* Logo */}
                    <VStack className="gap-2">
                      <Text className="font-medium text-gray-900">
                        Logo (opcional)
                      </Text>
                      <Pressable onPress={() => pickImage('logo')}>
                        <Card className="p-4 border-2 border-dashed border-gray-300">
                          {logo ? (
                            <Image 
                              source={{ uri: logo }} 
                              className="w-24 h-24 rounded-lg mx-auto"
                            />
                          ) : (
                            <Center className="py-4">
                              <Icon as={CameraIcon} className="text-gray-400 mb-2 w-8 h-8" />
                              <Text className="text-gray-600">Subir logo</Text>
                            </Center>
                          )}
                        </Card>
                      </Pressable>
                    </VStack>

                    {/* Cover photo */}
                    <VStack className="gap-2">
                      <Text className="font-medium text-gray-900">
                        Foto de portada (opcional)
                      </Text>
                      <Pressable onPress={() => pickImage('cover')}>
                        <Card className="p-4 border-2 border-dashed border-gray-300">
                          {coverPhoto ? (
                            <Image 
                              source={{ uri: coverPhoto }} 
                              className="w-full h-32 rounded-lg"
                            />
                          ) : (
                            <Center className="py-8">
                              <Icon as={ImageIcon} className="text-gray-400 mb-2 w-8 h-8" />
                              <Text className="text-gray-600">Subir foto de portada</Text>
                            </Center>
                          )}
                        </Card>
                      </Pressable>
                    </VStack>
                  </VStack>

                  {/* Form fields */}
                  <VStack className="gap-4">
                    <FormInput
                      name="name"
                      label="Nombre del gimnasio"
                      placeholder="Fitness Center Pro"
                    />

                    <FormInput
                      name="address"
                      label="Dirección"
                      placeholder="Av. Principal 123, Lima"
                    />

                    <FormInput
                      name="phone"
                      label="Teléfono"
                      placeholder="+51 999 999 999"
                      keyboardType="phone-pad"
                    />

                    <FormTextarea
                      name="description"
                      label="Descripción (opcional)"
                      placeholder="Describe tu gimnasio..."
                      numberOfLines={4}
                    />
                  </VStack>
                </VStack>
              </FormProvider>

              {/* Continue button */}
              <Box className="mt-auto pb-4">
                <Button
                  onPress={methods.handleSubmit(onSubmit)}
                  className="w-full"
                >
                  <ButtonText>Continuar</ButtonText>
                </Button>
              </Box>
            </VStack>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}