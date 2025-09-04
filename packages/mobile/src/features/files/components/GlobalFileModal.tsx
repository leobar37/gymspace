/**
 * # GlobalFileModal Component
 *
 * Modal global para previsualizar archivos multimedia en toda la aplicación.
 *
 * ## Características
 * - ✅ Vista previa de imágenes con zoom responsivo
 * - ✅ Reproductor de video nativo con controles
 * - ✅ Manejo de archivos no soportados
 * - ✅ Animación slide y presentación pageSheet
 * - ✅ Header con nombre del archivo y botón de cierre
 * - ✅ Integración con store global de archivos
 *
 * ## Tipos de archivo soportados
 * - **Imágenes**: JPG, PNG, GIF, WebP (detectados por mimeType startsWith 'image/')
 * - **Videos**: MP4, MOV, AVI (detectados por mimeType startsWith 'video/')
 * - **Otros**: Muestra mensaje de "Vista previa no disponible"
 *
 * ## Store Integration
 * ```tsx
 * const { openFileViewer } = useFilesStore();
 *
 * // Abrir archivo para previsualización
 * openFileViewer({
 *   id: 'file-123',
 *   originalName: 'documento.pdf',
 *   mimeType: 'image/jpeg',
 *   previewUrl: 'https://example.com/image.jpg'
 * });
 * ```
 *
 * ## Estado del Store
 * - `isViewerOpen`: Boolean que controla la visibilidad del modal
 * - `viewerFile`: Objeto con datos del archivo actual
 * - `closeFileViewer()`: Función para cerrar el modal
 *
 * ## Layout Structure
 * ```
 * Modal (pageSheet)
 * └── SafeAreaView
 *     ├── Header
 *     │   ├── Título (nombre del archivo)
 *     │   └── Botón cerrar (X)
 *     └── Content Area
 *         ├── Image (para imágenes)
 *         ├── Video (para videos)
 *         └── NoPreview (para otros tipos)
 * ```
 *
 * ## Responsive Design
 * - Ancho: `screenWidth - 32px` (16px padding cada lado)
 * - Alto: `70% de la pantalla` para content area
 * - Resize mode: `contain` para mantener aspect ratio
 *
 * ## Usage Example
 * El componente se renderiza automáticamente cuando hay un archivo en el store.
 * No requiere props ya que obtiene toda la información del store global.
 *
 * @example
 * ```tsx
 * // En cualquier parte de la app
 * import { useFilesStore } from '@/features/files/stores/files.store';
 *
 * function FileItem({ file }) {
 *   const { openFileViewer } = useFilesStore();
 *
 *   return (
 *     <TouchableOpacity onPress={() => openFileViewer(file)}>
 *       <Text>{file.name}</Text>
 *     </TouchableOpacity>
 *   );
 * }
 * ```
 */

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { XIcon } from 'lucide-react-native';
import React from 'react';
import { Dimensions, View, Modal, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFilesStore } from '../stores/files.store';
import { useFile } from '../controllers/files.controller';
import type { FileResponseDto } from '@gymspace/sdk';
export function GlobalFileModal() {
  const { isViewerOpen, viewerFile, viewerFileId, closeFileViewer } = useFilesStore();
  const { data: fetchedFile, isLoading, isError } = useFile(viewerFileId || '', !!viewerFileId && isViewerOpen);
  const screenDimensions = Dimensions.get('window');

  // Use viewerFile if available, otherwise use fetched file from fileId
  const file = viewerFile || fetchedFile;

  if (!isViewerOpen) return null;

  // Show loading state when fetching by ID
  if (viewerFileId && isLoading) {
    return (
      <Modal
        visible={isViewerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeFileViewer}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>
              Cargando archivo...
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Show error state if fetching failed
  if (viewerFileId && (isError || !file)) {
    return (
      <Modal
        visible={isViewerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeFileViewer}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <Text style={{ fontSize: 18, color: '#374151', marginBottom: 8, textAlign: 'center' }}>
              Error al cargar el archivo
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 }}>
              No se pudo cargar el archivo solicitado
            </Text>
            <TouchableOpacity
              onPress={closeFileViewer}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 16, color: '#374151' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  if (!file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');

  const handleClose = () => {
    closeFileViewer();
  };

  return (
    <Modal
      visible={isViewerOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#e5e5e5',
            backgroundColor: 'white',
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              flex: 1,
              marginRight: 16,
            }}
            numberOfLines={1}
          >
            {file.originalName}
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: '#f5f5f5',
            }}
          >
            <Icon as={XIcon} size="lg" style={{ color: '#000' }} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          {isImage && (
            <Image
              source={{ uri: file.previewUrl }}
              style={{
                width: screenDimensions.width - 32,
                height: screenDimensions.height * 0.7,
              }}
              onError={() => {
                console.log('Error loading image');
              }}
              contentFit="contain"
            />
          )}

          {isVideo && (
            <Video
              source={{ uri: file.previewUrl }}
              style={{
                width: screenDimensions.width - 32,
                height: screenDimensions.height * 0.7,
              }}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              useNativeControls
              isLooping={false}
            />
          )}

          {!isImage && !isVideo && (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  color: '#374151',
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Vista previa no disponible
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6b7280',
                  textAlign: 'center',
                }}
              >
                No se puede mostrar una vista previa de este tipo de archivo
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * GlobalFileModalById - Version that accepts a fileId and fetches the file data
 * 
 * @example
 * ```tsx
 * <GlobalFileModalById 
 *   fileId="file-123"
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
interface GlobalFileModalByIdProps {
  fileId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function GlobalFileModalById({ fileId, visible, onClose }: GlobalFileModalByIdProps) {
  const { data: file, isLoading, isError } = useFile(fileId || '', !!fileId && visible);
  const screenDimensions = Dimensions.get('window');

  if (!fileId || !visible) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>
            Cargando archivo...
          </Text>
        </View>
      );
    }

    if (isError || !file) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 18, color: '#374151', marginBottom: 8, textAlign: 'center' }}>
            Error al cargar el archivo
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
            No se pudo cargar el archivo solicitado
          </Text>
        </View>
      );
    }

    const isImage = file.mimeType.startsWith('image/');
    const isVideo = file.mimeType.startsWith('video/');

    if (isImage) {
      return (
        <Image
          source={{ uri: file.previewUrl }}
          style={{
            width: screenDimensions.width - 32,
            height: screenDimensions.height * 0.7,
          }}
          onError={() => {
            console.log('Error loading image');
          }}
          contentFit="contain"
        />
      );
    }

    if (isVideo) {
      return (
        <Video
          source={{ uri: file.previewUrl }}
          style={{
            width: screenDimensions.width - 32,
            height: screenDimensions.height * 0.7,
          }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          useNativeControls
          isLooping={false}
        />
      );
    }

    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 18, color: '#374151', marginBottom: 8, textAlign: 'center' }}>
          Vista previa no disponible
        </Text>
        <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
          No se puede mostrar una vista previa de este tipo de archivo
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#e5e5e5',
            backgroundColor: 'white',
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              flex: 1,
              marginRight: 16,
            }}
            numberOfLines={1}
          >
            {file?.originalName || 'Archivo'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: '#f5f5f5',
            }}
          >
            <Icon as={XIcon} size="lg" style={{ color: '#000' }} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          {renderContent()}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
