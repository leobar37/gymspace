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
import { XIcon } from 'lucide-react-native';
import React from 'react';
import { Dimensions, View, Image, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { useFilesStore } from '../stores/files.store';
export function GlobalFileModal() {
  const { isViewerOpen, viewerFile, closeFileViewer } = useFilesStore();
  const screenDimensions = Dimensions.get('window');

  if (!viewerFile) return null;

  const isImage = viewerFile.mimeType.startsWith('image/');
  const isVideo = viewerFile.mimeType.startsWith('video/');

  const handleClose = () => {
    closeFileViewer();
  };
  console.log('dos', screenDimensions);

  console.log(
    'view file',
    JSON.stringify(
      {
        viewerFile,
        isImage,
        isVideo,
      },
      null,
      2,
    ),
  );

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
            {viewerFile.originalName}
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
              source={{ uri: viewerFile.previewUrl }}
              style={{
                width: screenDimensions.width - 32,
                height: screenDimensions.height * 0.7,
              }}
              onError={(err) => {
                console.log('Error loading image', err);
              }}
              resizeMode="contain"
            />
          )}

          {isVideo && (
            <Video
              source={{ uri: viewerFile.previewUrl }}
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
