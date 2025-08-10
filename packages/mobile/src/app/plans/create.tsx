import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { CreatePlanForm } from '@/features/plans';

export default function CreatePlanScreen() {
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
          <CreatePlanForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}