import React from 'react';
import { View, ActivityIndicator, Dimensions, Pressable, FlatList } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { ImageIcon } from 'lucide-react-native';
import { useFilesStore } from '../stores/files.store';
import { useFilesByIds } from '../controllers/files.controller';
import { FilePreview } from './FilePreview';

interface FileSelectorProps {
  name: string;
  multi?: boolean;
  label?: string;
  required?: boolean;
}

export function FileSelector({
  name,
  multi = false,
  label,
  required = false,
}: FileSelectorProps) {
  const { control, watch } = useFormContext();
  const { openModal } = useFilesStore();
  
  // Watch the form value
  const formValue = watch(name);
  
  // Determine the file IDs based on multi mode
  const fileIds = React.useMemo(() => {
    if (!formValue) return [];
    
    if (multi) {
      // For multi mode, formValue should be an array
      return Array.isArray(formValue) ? formValue : [];
    } else {
      // For single mode, formValue should be a string
      return formValue ? [formValue] : [];
    }
  }, [formValue, multi]);
  
  // Fetch file data
  const { data: files, isLoading } = useFilesByIds(fileIds);
  
  console.log("files", {
    files,
    fileIds
  });
  
  const handleOpenSelector = (onChange: (value: any) => void) => {
    openModal({
      isMulti: multi,
      selectedFiles: fileIds,
      onSelect: (selectedIds) => {
        // Pass the value directly based on multi mode
        const newValue = multi
          ? selectedIds
          : selectedIds[0] || null;
        
        onChange(newValue);
      },
    });
  };
  
  const screenWidth = Dimensions.get('window').width;
  const carouselWidth = screenWidth - 32; // Account for padding
  
  return (
    <>
      <Controller
        control={control}
        name={name}
        rules={{ required: required ? 'Se requiere un archivo' : undefined }}
        render={({ field: { onChange }, fieldState: { error } }) => (
          <VStack space="sm" className="w-full">
            {label && (
              <Text className="text-sm font-medium text-gray-700">{label}</Text>
            )}
            
            {/* File Preview Area */}
            {isLoading ? (
              <View className="h-48 bg-gray-100 rounded-lg items-center justify-center">
                <ActivityIndicator size="large" />
              </View>
            ) : files && files.length > 0 ? (
              <View className="w-full">
                {files.length === 1 ? (
                  // Single file - show directly with click to change
                  <Pressable onPress={() => handleOpenSelector(onChange)}>
                    <View className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <FilePreview
                        file={files[0]}
                        width={carouselWidth}
                        height={192}
                        resizeMode="contain"
                        className="rounded-lg"
                      />
                    </View>
                  </Pressable>
                ) : (
                  // Multiple files - show 2x2 grid using FlatList
                  <Pressable onPress={() => handleOpenSelector(onChange)}>
                    <View className="w-full">
                      <FlatList
                        data={files.slice(0, 4)}
                        renderItem={({ item, index }) => (
                          <View style={{ flex: 1, padding: 8 }}>
                            <View style={{ position: 'relative' }}>
                              <View 
                                style={{
                                  borderRadius: 12,
                                  overflow: 'hidden',
                                  backgroundColor: '#f3f4f6'
                                }}
                              >
                                <FilePreview
                                  file={item}
                                  width={undefined}
                                  height={undefined}
                                  resizeMode="cover"
                                />
                              </View>
                              {/* Show +N overlay on the 4th item if there are more */}
                              {index === 3 && files.length > 4 && (
                                <View className="absolute inset-0 bg-black/60 rounded-xl items-center justify-center">
                                  <Text className="text-white text-lg font-bold">+{files.length - 4}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        )}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        scrollEnabled={false}
                        columnWrapperStyle={{ paddingHorizontal: 4 }}
                        contentContainerStyle={{ paddingVertical: 4 }}
                      />
                      <Text className="text-center text-xs text-gray-500 mt-2">
                        {files.length} archivo{files.length !== 1 ? 's' : ''} seleccionado{files.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>
            ) : (
              // No files - show clickable placeholder
              <Pressable onPress={() => handleOpenSelector(onChange)}>
                <View className="h-48 bg-gray-100 rounded-lg items-center justify-center border-2 border-dashed border-gray-300">
                  <Icon as={ImageIcon} size="xl" className="text-gray-400 mb-2" />
                  <Text className="text-gray-500">Sin archivos seleccionados</Text>
                  <Text className="text-xs text-gray-400 mt-1">Toca para seleccionar</Text>
                </View>
              </Pressable>
            )}
            
            {/* Error Message */}
            {error && (
              <Text className="text-xs text-red-500">{error.message}</Text>
            )}
          </VStack>
        )}
      />
    </>
  );
}