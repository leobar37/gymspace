# usePreviewAsset Hook

Hook para mostrar un modal con la vista previa de un asset.

## Instalación

El hook ya está exportado desde el módulo de assets:

```tsx
import { usePreviewAsset } from '@/features/assets';
```

## Uso Básico

### Opción 1: Uso directo en un componente

```tsx
import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { usePreviewAsset } from '@/features/assets';

function MyComponent() {
  const { showPreview, PreviewModal } = usePreviewAsset();
  
  const handlePreviewAsset = (assetId: string) => {
    showPreview(assetId);
  };
  
  return (
    <View>
      <Pressable onPress={() => handlePreviewAsset('asset-id-here')}>
        <Text>Ver imagen</Text>
      </Pressable>
      
      {/* Renderizar el modal */}
      <PreviewModal />
    </View>
  );
}
```

### Opción 2: Uso con Provider (Recomendado para aplicaciones)

En tu componente raíz o layout principal:

```tsx
import { AssetPreviewProvider } from '@/features/assets';

function RootLayout() {
  return (
    <AssetPreviewProvider>
      {/* Tu aplicación */}
      <App />
    </AssetPreviewProvider>
  );
}
```

Luego en cualquier componente hijo:

```tsx
import { usePreviewAsset } from '@/features/assets';

function GalleryItem({ assetId }: { assetId: string }) {
  const { showPreview } = usePreviewAsset();
  
  return (
    <Pressable onPress={() => showPreview(assetId)}>
      <AssetPreview assetId={assetId} size="small" />
    </Pressable>
  );
}
```

## API

### usePreviewAsset()

Retorna un objeto con las siguientes propiedades:

- `showPreview(assetId: string)`: Función para mostrar el modal con la vista previa del asset
- `hidePreview()`: Función para cerrar el modal
- `PreviewModal`: Componente React del modal que debe ser renderizado
- `isPreviewVisible`: Boolean que indica si el modal está visible
- `currentAssetId`: String con el ID del asset actual siendo mostrado (o null)

## Características del Modal

El modal de vista previa incluye:

- **Vista previa a pantalla completa**: Muestra la imagen con `resizeMode="contain"` para ver toda la imagen
- **Información del archivo**: Muestra el nombre, tipo MIME, tamaño y fecha de creación
- **Botón de cerrar**: Para cerrar el modal
- **Preparado para funcionalidad futura**: Botones de descarga y compartir (actualmente deshabilitados)

## Ejemplo Completo

```tsx
import React from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { usePreviewAsset, AssetPreview } from '@/features/assets';

function AssetGallery({ assetIds }: { assetIds: string[] }) {
  const { showPreview, PreviewModal } = usePreviewAsset();
  
  return (
    <View>
      <FlatList
        data={assetIds}
        renderItem={({ item }) => (
          <Pressable onPress={() => showPreview(item)}>
            <AssetPreview
              assetId={item}
              size="medium"
              resizeMode="cover"
            />
          </Pressable>
        )}
        keyExtractor={(item) => item}
        numColumns={2}
      />
      
      {/* Modal de vista previa */}
      <PreviewModal />
    </View>
  );
}
```

## Notas

- El modal se abre con animación tipo "slide" desde abajo
- El modal es de pantalla completa para mejor visualización
- La imagen se carga usando `expo-image` con caché automático
- El modal maneja estados de carga y error automáticamente