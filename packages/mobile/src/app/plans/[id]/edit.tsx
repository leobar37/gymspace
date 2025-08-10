import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { CreatePlanForm, usePlansController } from '@/features/plans';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditPlanScreen() {
  const { id } = useLocalSearchParams();
  const planId = typeof id === 'string' ? id : '';
  const { usePlanDetail } = usePlansController();
  
  const { data: plan, isLoading, error } = usePlanDetail(planId);
  
  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center bg-white">
        <Spinner size="large" />
      </Box>
    );
  }
  
  if (error || !plan) {
    return (
      <Box className="flex-1 items-center justify-center bg-white">
        <Text className="text-red-500">Error al cargar el plan</Text>
      </Box>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <CreatePlanForm
            initialData={plan}
            isEditing={true}
            planId={planId}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}