import { Icon } from '@/components/ui/icon';
import { ShoppingCartIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export const SalesButton: React.FC = () => {
  const router = useRouter();

  const handlePress = () => {
    router.push('/(tabs)/sales-history');
  };

  return (
    <Pressable
      onPress={handlePress}
      className="absolute bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg"
      style={{
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      }}
    >
      <Icon as={ShoppingCartIcon} className="w-7 h-7 text-white" />
    </Pressable>
  );
};