import React from 'react';
import { Pressable } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { MinusIcon, PlusIcon } from 'lucide-react-native';

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 999,
  disabled = false,
  size = 'md',
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    const newQuantity = Math.max(min, quantity - 1);
    if (newQuantity !== quantity) {
      onQuantityChange(newQuantity);
    }
  };

  const handleIncrease = () => {
    const newQuantity = Math.min(max, quantity + 1);
    if (newQuantity !== quantity) {
      onQuantityChange(newQuantity);
    }
  };

  const canDecrease = !disabled && quantity > min;
  const canIncrease = !disabled && quantity < max;

  const sizeStyles = {
    sm: {
      button: 'w-8 h-8',
      icon: 'w-3 h-3',
      text: 'text-sm',
      container: 'min-w-16',
    },
    md: {
      button: 'w-10 h-10',
      icon: 'w-4 h-4',
      text: 'text-base',
      container: 'min-w-20',
    },
    lg: {
      button: 'w-12 h-12',
      icon: 'w-5 h-5',
      text: 'text-lg',
      container: 'min-w-24',
    },
  };

  const styles = sizeStyles[size];

  return (
    <HStack className={`items-center ${styles.container}`} space="xs">
      <Pressable
        onPress={handleDecrease}
        disabled={!canDecrease}
        className={`
          ${styles.button} rounded-full border items-center justify-center
          ${canDecrease 
            ? 'bg-gray-100 border-gray-300 active:bg-gray-200' 
            : 'bg-gray-50 border-gray-200 opacity-50'
          }
        `}
      >
        <Icon 
          as={MinusIcon} 
          className={`${styles.icon} ${canDecrease ? 'text-gray-700' : 'text-gray-400'}`} 
        />
      </Pressable>

      <Text className={`${styles.text} font-medium text-center text-gray-900 min-w-8`}>
        {quantity}
      </Text>

      <Pressable
        onPress={handleIncrease}
        disabled={!canIncrease}
        className={`
          ${styles.button} rounded-full border items-center justify-center
          ${canIncrease 
            ? 'bg-blue-50 border-blue-300 active:bg-blue-100' 
            : 'bg-gray-50 border-gray-200 opacity-50'
          }
        `}
      >
        <Icon 
          as={PlusIcon} 
          className={`${styles.icon} ${canIncrease ? 'text-blue-600' : 'text-gray-400'}`} 
        />
      </Pressable>
    </HStack>
  );
}