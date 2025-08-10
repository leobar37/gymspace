import React, { useState, useMemo } from 'react';
import { View, Platform, Modal, TouchableWithoutFeedback, ActivityIndicator, TextInput } from 'react-native';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText } from '@/components/ui/form-control';
import { Button, ButtonText } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { ChevronDownIcon, XIcon, SearchIcon, TagIcon } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { useCategoriesController } from '../controllers/categories.controller';
import type { ProductCategory } from '@gymspace/sdk';

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
  onCategorySelect
}: CategorySelectorProps<TFieldValues>) {
  const { field, fieldState } = useController({ 
    name, 
    control,
    rules,
    defaultValue,
    shouldUnregister
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
      return categoriesData.filter((category: ProductCategory) => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
  
  const CategoryColor = ({ color }: { color?: string }) => {
    if (!color) return null;
    return (
      <View 
        className="w-4 h-4 rounded-full" 
        style={{ backgroundColor: color }}
      />
    );
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
          
          <Pressable
            onPress={openModal}
            disabled={!enabled}
          >
            <View className={`
              bg-white 
              border 
              ${fieldState.error ? 'border-red-500' : 'border-gray-300'} 
              rounded-lg 
              px-4
              py-4
              min-h-[60px]
              ${!enabled ? 'opacity-50' : ''}
            `}>
              <HStack className="justify-between items-center flex-1">
                {selectedCategory ? (
                  <HStack className="flex-1 items-center gap-2">
                    {selectedCategory.color && (
                      <CategoryColor color={selectedCategory.color} />
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
      
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View className="flex-1 bg-black/50">
          <TouchableWithoutFeedback onPress={handleCancel}>
            <View className="flex-1" />
          </TouchableWithoutFeedback>
          
          <View className="bg-white rounded-t-3xl h-5/6">
            {/* Header */}
            <View className="px-6 py-4 border-b border-gray-200">
              <HStack className="justify-between items-center mb-4">
                <Text className="text-lg font-semibold text-gray-900">
                  {label || 'Seleccionar categoría'}
                </Text>
                <Pressable onPress={handleCancel} className="p-1">
                  <Icon as={XIcon} className="text-gray-400" size="md" />
                </Pressable>
              </HStack>
              
              {/* Search Bar */}
              <View className="relative">
                <View className="absolute left-3 top-3 z-10">
                  <Icon as={SearchIcon} className="text-gray-400" size="sm" />
                </View>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar categoría..."
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-base"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            
            {/* Categories List */}
            <ScrollView className="flex-1 px-6">
              {isLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="mt-2 text-gray-500">Cargando categorías...</Text>
                </View>
              ) : error ? (
                <View className="py-8 items-center">
                  <Text className="text-red-500">Error al cargar categorías</Text>
                </View>
              ) : categories.length === 0 ? (
                <View className="py-8 items-center">
                  <Icon as={TagIcon} className="text-gray-300 mb-2" size="xl" />
                  <Text className="text-gray-500">
                    {searchQuery ? 'No se encontraron categorías' : 'No hay categorías disponibles'}
                  </Text>
                </View>
              ) : (
                <VStack className="py-2 gap-1">
                  {categories.map((category: ProductCategory) => (
                    <Pressable
                      key={category.id}
                      onPress={() => handleCategoryPress(category.id)}
                      className={`
                        p-4 rounded-lg border
                        ${tempValue === category.id 
                          ? 'bg-blue-50 border-blue-400' 
                          : 'bg-white border-gray-200'
                        }
                      `}
                    >
                      <HStack className="justify-between items-start">
                        <HStack className="flex-1 items-center gap-3">
                          {category.color && (
                            <CategoryColor color={category.color} />
                          )}
                          <VStack className="flex-1 gap-0.5">
                            <Text className={`font-medium ${
                              tempValue === category.id ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {category.name}
                            </Text>
                            {category.description && (
                              <Text className={`text-xs ${
                                tempValue === category.id ? 'text-blue-700' : 'text-gray-500'
                              }`} numberOfLines={2}>
                                {category.description}
                              </Text>
                            )}
                            {category._count?.products !== undefined && (
                              <Text className={`text-xs ${
                                tempValue === category.id ? 'text-blue-600' : 'text-gray-400'
                              }`}>
                                {category._count.products} {category._count.products === 1 ? 'producto' : 'productos'}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                        {tempValue === category.id && (
                          <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                            <Text className="text-white text-xs">✓</Text>
                          </View>
                        )}
                      </HStack>
                    </Pressable>
                  ))}
                </VStack>
              )}
            </ScrollView>
            
            {/* Footer */}
            <View className="px-6 py-4 border-t border-gray-200">
              <HStack className="gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onPress={handleCancel}
                  className="flex-1"
                >
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button
                  size="md"
                  onPress={handleSave}
                  className="flex-1"
                  disabled={!tempValue}
                >
                  <ButtonText>Seleccionar</ButtonText>
                </Button>
              </HStack>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}