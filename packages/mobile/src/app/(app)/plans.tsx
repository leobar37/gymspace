import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Pressable } from 'react-native';
import { PlansList } from '@/features/plans';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function PlansScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <View className="flex-1">
        {/* Header with back button */}
        <HStack className="px-4 py-3 bg-white border-b border-gray-200 items-center">
          <Pressable 
            onPress={() => router.push('/(app)/')}
            className="p-2"
          >
            <Icon as={ArrowLeft} className="w-6 h-6 text-gray-700" />
          </Pressable>
        </HStack>
        
        <PlansList />
      </View>
    </SafeAreaView>
  );
}