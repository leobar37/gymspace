import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Input, InputField } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { SearchIcon, XIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

interface InputSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  isSheet?: boolean;
}

export const InputSearch: React.FC<InputSearchProps> = ({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  onClear,
  isSheet = false,
}) => {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  if (isSheet) {
    return (
      <View style={styles.container}>
        <Icon
          as={SearchIcon}
          style={styles.searchIcon}
          className="w-5 h-5 text-gray-400"
        />
        <BottomSheetTextInput
          style={styles.sheetInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#9CA3AF"
        />
        {value.length > 0 && (
          <Pressable
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon as={XIcon} className="w-5 h-5 text-gray-400" />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View className="relative">
      <Input variant="outline" size="md">
        <Icon
          as={SearchIcon}
          className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10 pointer-events-none"
        />
        <InputField
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          className="pl-10 pr-10"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable
            onPress={handleClear}
            className="absolute right-3 top-3 z-10"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon as={XIcon} className="w-5 h-5 text-gray-400" />
          </Pressable>
        )}
      </Input>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetInput: {
    flex: 1,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    pointerEvents: 'none',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    zIndex: 10,
  },
});