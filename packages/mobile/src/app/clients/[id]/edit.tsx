import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { CreateClientForm } from '@/features/clients/components/CreateClientForm';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import { VStack } from '@/components/ui/vstack';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { useClientDetail } = useClientsController();
  
  const { data: client, isLoading } = useClientDetail(id);

  if (isLoading) {
    return (
      <VStack className="flex-1 items-center justify-center">
        <Spinner className="text-blue-600" />
        <Text className="text-gray-600 mt-2">Cargando cliente...</Text>
      </VStack>
    );
  }

  if (!client) {
    return (
      <VStack className="flex-1 items-center justify-center p-8">
        <Text className="text-gray-600">Cliente no encontrado</Text>
      </VStack>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Editar Cliente',
          headerBackTitle: client.name,
        }} 
      />
      <CreateClientForm initialData={client} isEditing={true} clientId={id} />
    </>
  );
}