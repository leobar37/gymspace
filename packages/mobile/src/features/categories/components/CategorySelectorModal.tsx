import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { ProductCategory } from '@gymspace/sdk';
import { PlusIcon, SearchIcon, TagIcon, XIcon } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { router } from 'expo-router';

interface CategorySelectorModalProps {
  showModal: boolean;
  onClose: () => void;
  onSave: () => void;
  label?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: ProductCategory[];
  isLoading: boolean;
  error: any;
  tempValue: string;
  onCategoryPress: (categoryId: string) => void;
  selectedCategory: ProductCategory | null;
}

const CategoryColor = ({ color }: { color?: string }) => {
  if (!color) return null;
  return <View className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />;
};

const EmptyState = ({ searchQuery, onClose }: { searchQuery: string; onClose: () => void }) => {
  const handleCreateCategory = () => {
    onClose();
    router.push('/inventory/categories/new');
  };

  return (
    <View className="py-8 items-center">
      <Icon as={TagIcon} className="text-gray-300 mb-4" size="xl" />
      <Text className="text-gray-500 mb-4 text-center">
        {searchQuery ? 'No se encontraron categorías' : 'No hay categorías disponibles'}
      </Text>
      {!searchQuery && (
        <Button variant="outline" size="sm" onPress={handleCreateCategory}>
          <Icon as={PlusIcon} className="mr-2" size="sm" />
          <ButtonText>Crear nueva categoría</ButtonText>
        </Button>
      )}
    </View>
  );
};

const CategoriesList = ({ 
  categories, 
  tempValue, 
  onCategoryPress, 
  onCreateNew 
}: {
  categories: ProductCategory[];
  tempValue: string;
  onCategoryPress: (categoryId: string) => void;
  onCreateNew: () => void;
}) => {
  return (
    <VStack className="py-2 gap-1">
      {/* Create new category button */}
      <Pressable
        onPress={onCreateNew}
        className="p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 mb-2"
      >
        <HStack className="items-center gap-3 justify-center">
          <Icon as={PlusIcon} className="text-gray-500" size="sm" />
          <Text className="text-gray-700 font-medium">Crear nueva categoría</Text>
        </HStack>
      </Pressable>

      {/* Categories list */}
      {categories.map((category: ProductCategory) => (
        <Pressable
          key={category.id}
          onPress={() => onCategoryPress(category.id)}
          className={`
            p-4 rounded-lg border
            ${
              tempValue === category.id
                ? 'bg-blue-50 border-blue-400'
                : 'bg-white border-gray-200'
            }
          `}
        >
          <HStack className="justify-between items-start">
            <HStack className="flex-1 items-center gap-3">
              {category.color && <CategoryColor color={category.color} />}
              <VStack className="flex-1 gap-0.5">
                <Text
                  className={`font-medium ${
                    tempValue === category.id ? 'text-blue-900' : 'text-gray-900'
                  }`}
                >
                  {category.name}
                </Text>
                {category.description && (
                  <Text
                    className={`text-xs ${
                      tempValue === category.id ? 'text-blue-700' : 'text-gray-500'
                    }`}
                    numberOfLines={2}
                  >
                    {category.description}
                  </Text>
                )}
                {category._count?.products !== undefined && (
                  <Text
                    className={`text-xs ${
                      tempValue === category.id ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {category._count.products}{' '}
                    {category._count.products === 1 ? 'producto' : 'productos'}
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
  );
};

export function CategorySelectorModal({
  showModal,
  onClose,
  onSave,
  label,
  searchQuery,
  onSearchChange,
  categories,
  isLoading,
  error,
  tempValue,
  onCategoryPress,
}: CategorySelectorModalProps) {
  const handleCreateCategory = () => {
    onClose();
    router.push('/inventory/categories/new');
  };

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1" />
        </TouchableWithoutFeedback>

        <View className="bg-white rounded-t-3xl h-5/6">
          {/* Header */}
          <View className="px-6 py-4 border-b border-gray-200">
            <HStack className="justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                {label || 'Seleccionar categoría'}
              </Text>
              <Pressable onPress={onClose} className="p-1">
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
                onChangeText={onSearchChange}
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
              <EmptyState searchQuery={searchQuery} onClose={onClose} />
            ) : (
              <CategoriesList
                categories={categories}
                tempValue={tempValue}
                onCategoryPress={onCategoryPress}
                onCreateNew={handleCreateCategory}
              />
            )}
          </ScrollView>

          {/* Footer */}
          <View className="px-6 py-4 border-t border-gray-200">
            <HStack className="gap-3">
              <Button variant="outline" size="md" onPress={onClose} className="flex-1">
                <ButtonText>Cancelar</ButtonText>
              </Button>
              <Button size="md" onPress={onSave} className="flex-1" disabled={!tempValue}>
                <ButtonText>Seleccionar</ButtonText>
              </Button>
            </HStack>
          </View>
        </View>
      </View>
    </Modal>
  );
}