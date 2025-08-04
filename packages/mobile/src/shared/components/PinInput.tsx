import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Pressable, Keyboard } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function PinInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
}: PinInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handlePress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleTextChange = (text: string) => {
    // Only allow digits
    const digits = text.replace(/\D/g, '');
    if (digits.length <= length) {
      onChange(digits);
    }
  };

  const renderBoxes = () => {
    const boxes = [];
    for (let i = 0; i < length; i++) {
      const isFilled = value[i] !== undefined;
      const isCurrentBox = value.length === i;
      
      boxes.push(
        <Box
          key={i}
          className={`
            w-12 h-14 border-2 rounded-lg items-center justify-center
            ${error ? 'border-red-500 bg-red-50' : 
              isFilled ? 'border-blue-500 bg-blue-50' : 
              isCurrentBox && isFocused ? 'border-blue-400' : 
              'border-gray-300 bg-white'}
            ${disabled ? 'opacity-50' : ''}
          `}
        >
          <Text className={`text-xl font-semibold ${error ? 'text-red-500' : 'text-gray-900'}`}>
            {value[i] || ''}
          </Text>
        </Box>
      );
    }
    return boxes;
  };

  return (
    <Pressable onPress={handlePress}>
      <HStack className="justify-center gap-2">
        {renderBoxes()}
      </HStack>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleTextChange}
        keyboardType="numeric"
        maxLength={length}
        style={{ position: 'absolute', opacity: 0, height: 0 }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        editable={!disabled}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
      />
    </Pressable>
  );
}