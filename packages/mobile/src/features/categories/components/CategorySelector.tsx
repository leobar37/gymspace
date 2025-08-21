import { Button, ButtonText } from '@/components/ui/button';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { ProductCategory } from '@gymspace/sdk';
import { ChevronDownIcon, PlusIcon, SearchIcon, TagIcon, XIcon } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import type { FieldValues, UseControllerProps } from 'react-hook-form';
import { useController } from 'react-hook-form';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { router } from 'expo-router';
import { useCategoriesController } from '../controllers/categories.controller';
import { CategorySelectorModal } from './CategorySelectorModal';

interface CategorySelectorProps<TFieldValues extends FieldValues = FieldValues>
  extends UseControllerProps<TFieldValues> {
  label?: string;
  description?: string;
  placeholder?: string;
  enabled?: boolean;
  allowClear?: boolean;
  onCategorySelect?: (category: ProductCategory | null) => void;
}

export function CategorySelector<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label = 'Categoría',
  description,
  placeholder = 'Seleccionar categoría',
  enabled = true,
  allowClear = false,
  onCategorySelect,
}: CategorySelectorProps<TFieldValues>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempValue, setTempValue] = useState(field.value || '');

  const { useCategoriesList } = useCategoriesController();

  // Fetch categories list
  const { data: categoriesData, isLoading, error } = useCategoriesList();

  const categories = useMemo(() => {
    if (!categoriesData) return [];

    // Filter categories based on search query
    if (searchQuery) {
      return categoriesData.filter(
        (category: ProductCategory) =>
          category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (category.description &&
            category.description.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    return categoriesData;
  }, [categoriesData, searchQuery]);

  // Find selected category
  const selectedCategory = useMemo(() => {
    if (!field.value || !categoriesData) return null;
    return categoriesData.find((c: ProductCategory) => c.id === field.value);
  }, [field.value, categoriesData]);

  const handleSave = () => {
    field.onChange(tempValue);
    const selected = categories.find((c: ProductCategory) => c.id === tempValue);
    onCategorySelect?.(selected || null);
    setShowModal(false);
  };

  const handleCancel = () => {
    setTempValue(field.value || '');
    setSearchQuery('');
    setShowModal(false);
  };

  const handleClear = () => {
    field.onChange('');
    onCategorySelect?.(null);
  };

  const openModal = () => {
    if (enabled) {
      setTempValue(field.value || '');
      setSearchQuery('');
      setShowModal(true);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    setTempValue(categoryId);
  };


  return (
    <>
      <FormControl isInvalid={!!fieldState.error}>
        <VStack className="gap-1">
          {label && <Text className="font-medium text-gray-900">{label}</Text>}

          {description && (
            <FormControlHelper>
              <FormControlHelperText>{description}</FormControlHelperText>
            </FormControlHelper>
          )}

          <Pressable onPress={openModal} disabled={!enabled}>
            <View
              className={`
              bg-white 
              border 
              ${fieldState.error ? 'border-red-500' : 'border-gray-300'} 
              rounded-lg 
              px-4
              py-4
              min-h-[60px]
              ${!enabled ? 'opacity-50' : ''}
            `}
            >
              <HStack className="justify-between items-center flex-1">
                {selectedCategory ? (
                  <HStack className="flex-1 items-center gap-2">
                    {selectedCategory.color && (
                      <View className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
                    )}
                    <VStack className="flex-1 gap-0.5">
                      <Text className="text-gray-900 font-medium">{selectedCategory.name}</Text>
                      {selectedCategory.description && (
                        <Text className="text-xs text-gray-500" numberOfLines={1}>
                          {selectedCategory.description}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                ) : (
                  <Text className="flex-1 text-gray-400">{placeholder}</Text>
                )}
                <HStack className="gap-2 items-center">
                  {allowClear && field.value && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="p-1"
                    >
                      <Icon as={XIcon} className="text-gray-400" size="sm" />
                    </Pressable>
                  )}
                  <Icon as={ChevronDownIcon} className="text-gray-400" size="md" />
                </HStack>
              </HStack>
            </View>
          </Pressable>

          {fieldState.error && (
            <FormControlError>
              <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
            </FormControlError>
          )}
        </VStack>
      </FormControl>

      <CategorySelectorModal
        showModal={showModal}
        onClose={handleCancel}
        onSave={handleSave}
        label={label}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        isLoading={isLoading}
        error={error}
        tempValue={tempValue}
        onCategoryPress={handleCategoryPress}
        selectedCategory={selectedCategory}
      />
    </>
  );
}
