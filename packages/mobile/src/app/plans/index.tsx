import { PlansList } from '@/features/plans';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PlansScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <PlansList />
    </SafeAreaView>
  );
}
