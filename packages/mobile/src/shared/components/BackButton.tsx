import React from 'react';
import { ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { HStack } from '@/components/ui/hstack';

interface BackButtonProps {
  onPress?: () => void;
  label?: string;
  style?: ViewStyle;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  label = 'Volver',
  style,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable onPress={handlePress} style={[{ marginLeft: 10 }, style]}>
      <HStack space="xs" className="items-center">
        <Icon as={ChevronLeft} size="sm" style={{ color: '#374151' }} />
        <Text style={{ color: '#374151' }}>{label}</Text>
      </HStack>
    </Pressable>
  );
};
