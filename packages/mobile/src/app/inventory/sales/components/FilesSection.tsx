import React from 'react';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { View } from '@/components/ui/view';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Pressable } from '@/components/ui/pressable';
import { FileTextIcon } from 'lucide-react-native';
import { useFilesByIds, useFilesStore } from '@/features/files';
import { FilePreview } from '@/features/files/components/FilePreview';

interface FilesSectionProps {
  fileIds: string[];
}

export function FilesSection({ fileIds }: FilesSectionProps) {
  const { openFileViewer } = useFilesStore();
  const { data: files, isLoading: isLoadingFiles } = useFilesByIds(fileIds);

  if (fileIds.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white border border-gray-200">
      <VStack space="md" className="p-4">
        <HStack className="justify-between items-center">
          <Text className="text-lg font-semibold text-gray-900">
            Archivos Adjuntos
          </Text>
          <Text className="text-sm text-gray-600">
            {files?.length || 0} archivo{(files?.length || 0) !== 1 ? 's' : ''}
          </Text>
        </HStack>
        
        {isLoadingFiles ? (
          <HStack space="sm" className="items-center justify-center py-4">
            <Spinner size="small" />
            <Text className="text-gray-600">
              Cargando archivos...
            </Text>
          </HStack>
        ) : files && files.length > 0 ? (
          <View className="w-full">
            <HStack space="sm" className="flex-wrap">
              {files.map((file, index) => (
                <Pressable
                  key={file.id}
                  onPress={() => openFileViewer(file)}
                  className="mb-2"
                >
                  <View className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                    <FilePreview 
                      file={file} 
                      width={96} 
                      height={96} 
                      resizeMode="cover" 
                    />
                  </View>
                  <Text className="text-xs text-gray-600 text-center mt-1 max-w-24" numberOfLines={1}>
                    {file.originalName}
                  </Text>
                </Pressable>
              ))}
            </HStack>
          </View>
        ) : (
          <HStack space="sm" className="items-center justify-center py-4">
            <Icon as={FileTextIcon} className="w-6 h-6 text-gray-400" />
            <Text className="text-gray-600">
              No se encontraron archivos
            </Text>
          </HStack>
        )}
      </VStack>
    </Card>
  );
}