import React from 'react';
import { ScrollView, View } from 'react-native';

interface ScreenFormProps {
  children: React.ReactNode;
  actions: React.ReactNode;
}

export const ScreenForm: React.FC<ScreenFormProps> = ({ children, actions }) => {
  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View className="px-7 pb-8 py-4 border-t border-gray-200 bg-white">
        {actions}
      </View>
    </View>
  );
};