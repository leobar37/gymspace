import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
import { router } from 'expo-router';

export default function CreateSupplierScreen() {
  const handleSuccess = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <SupplierForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}