import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
import { useSupplier } from '@/features/suppliers/controllers/suppliers.controller';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';

export default function EditSupplierScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: supplier, isLoading, isError } = useSupplier(id);

  const handleSuccess = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Spinner size="large" />
          <Text className="mt-4 text-gray-600">Cargando proveedor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !supplier) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-lg text-gray-600 text-center">
            No se pudo cargar la información del proveedor
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <SupplierForm 
        initialData={supplier}
        supplierId={id}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}