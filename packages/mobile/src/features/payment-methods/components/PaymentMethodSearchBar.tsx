import React from 'react';
import { View, TextInput } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { SearchIcon } from 'lucide-react-native';

interface PaymentMethodSearchBarProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export function PaymentMethodSearchBar({
  value,
  onChange,
  placeholder = 'Buscar por nombre o código...',
}: PaymentMethodSearchBarProps) {
  return (
    <View className="relative">
      <View className="absolute left-3 top-3 z-10">
        <Icon as={SearchIcon} className="text-gray-400" size="sm" />
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        className="bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-base"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}