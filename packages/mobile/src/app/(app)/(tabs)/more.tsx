import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileMenu } from '@/features/profile/components/ProfileMenu';

export default function MoreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ProfileMenu />
    </SafeAreaView>
  );
}