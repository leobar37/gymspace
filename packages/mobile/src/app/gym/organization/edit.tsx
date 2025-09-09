import React from 'react';
import { Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft } from 'lucide-react-native';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { useOrganization } from '@/features/organizations';
import { OrganizationUpdateForm } from '@/features/organizations';
import { Spinner } from '@/components/ui/spinner';

export default function EditOrganizationScreen() {
  const router = useRouter();
  const {
    session: { organization },
    isLoading: sessionLoading,
  } = useCurrentSession();

  const { data: organizationData, isLoading: orgLoading } = useOrganization(organization?.id || '');

  console.log('organization data:', organizationData);

  const isLoading = sessionLoading || orgLoading;

  const handleSuccess = () => {
    // Navigate back to organization screen
    router.back();
  };

  console.log("useOrganization", JSON.stringify({
    organization,
  }));

  const handleCancel = () => {
    // Navigate back to organization screen
    router.back();
  };

  if (isLoading && !organizationData) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Spinner size="large" />
        <Text className="mt-4 text-gray-600">Cargando información...</Text>
      </View>
    );
  }

  if (!organization || !organizationData) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <VStack space="lg" className="items-center">
          <Text className="text-lg text-center text-gray-700">
            No se pudo cargar la información de la organización
          </Text>
        </VStack>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Editar Nombre',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2">
              <Icon as={ChevronLeft} className="w-6 h-6 text-gray-700" />
            </Pressable>
          ),
        }}
      />

      <OrganizationUpdateForm
        organization={organizationData}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </>
  );
}
