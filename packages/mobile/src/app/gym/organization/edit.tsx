import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { OrganizationUpdateForm, useOrganization } from '@/features/organizations';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { useRouter } from 'expo-router';
import React from 'react';

export default function EditOrganizationScreen() {
  const router = useRouter();
  const {
    session: { organization },
    isLoading: sessionLoading,
  } = useCurrentSession();

  const { data: organizationData, isLoading: orgLoading } = useOrganization(organization?.id || '');

  const isLoading = sessionLoading || orgLoading;

  const handleSuccess = () => {
    // Navigate back to organization screen
    router.back();
  };

  console.log(
    'useOrganization',
    JSON.stringify({
      organization,
    }),
  );

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
      <OrganizationUpdateForm
        organization={organizationData}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </>
  );
}
