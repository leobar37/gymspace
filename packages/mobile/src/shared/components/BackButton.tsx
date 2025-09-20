import React, { useState, useEffect } from 'react';
import { ViewStyle } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { HStack } from '@/components/ui/hstack';
import { View } from 'react-native';

interface BackButtonProps {
  onPress?: () => void;
  label?: string;
  style?: ViewStyle;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  label = '',
  style,
}) => {
  const navigation = useNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', () => {
      setIsNavigating(true);
    });

    const unsubscribeFocus = navigation.addListener('focus', () => {
      setIsNavigating(false);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsNavigating(false);
    });

    return () => {
      unsubscribeBeforeRemove();
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const handlePress = () => {
    if (isNavigating) return;

    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isNavigating}
      style={[
        {
          marginLeft: -8, // Compensate for padding to align with screen edge
          paddingHorizontal: 12,
          paddingVertical: 8,
          minHeight: 44, // Apple's minimum touch target
          minWidth: 44,
          justifyContent: 'center',
          opacity: isNavigating ? 0.5 : 1,
        },
        style
      ]}
    >
      <HStack space="xs" className="items-center">
        <View className="bg-gray-100 rounded-full p-1.5">
          <Icon as={ChevronLeft} size="md" style={{ color: '#374151' }} />
        </View>
        {label ? (
          <Text style={{ color: '#374151', fontSize: 16, fontWeight: '500' }}>{label}</Text>
        ) : null}
      </HStack>
    </Pressable>
  );
};
