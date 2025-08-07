/**
 * Complete example showing how to use PhotoFieldV2 with prepareAssets
 * in a real form that handles client data with photos
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollView } from '@/components/ui/scroll-view';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';
import { FormProvider, FormInput } from '@/components/forms';
import { PhotoFieldV2 } from '../components/PhotoFieldV2';
import { prepareAssets, cleanupUploadedAssets } from '../utils/prepare-assets';
import { useGymSdk } from '@/providers/GymSdkProvider';
import type { AssetFieldValue } from '../types/asset-form.types';
import { Alert } from 'react-native';

// Define form schema
const clientFormSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  
  // Asset fields - can be string (existing), object (pending), or null
  photoId: z.any().optional(), // Will be validated as string after preparation
  documentFrontId: z.any().optional(),
  documentBackId: z.any().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormWithAssetsProps {
  clientId: string;
  initialData?: {
    name: string;
    email: string;
    phone?: string;
    photoId?: string; // Existing asset ID
    documentFrontId?: string; // Existing asset ID
    documentBackId?: string; // Existing asset ID
  };
  onSuccess?: () => void;
}

export function ClientFormWithAssets({ 
  clientId, 
  initialData, 
  onSuccess 
}: ClientFormWithAssetsProps) {
  const sdk = useGymSdk();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      // Initialize with existing asset IDs if available
      photoId: initialData?.photoId || null,
      documentFrontId: initialData?.documentFrontId || null,
      documentBackId: initialData?.documentBackId || null,
    },
  });

  const onSubmit = async (formData: ClientFormData) => {
    setIsSubmitting(true);
    let uploadedAssetIds: string[] = [];

    try {
      // Step 1: Prepare assets (upload new files, delete replaced ones)
      console.log('Preparing assets...');
      const assetResult = await prepareAssets(
        sdk,
        formData,
        {
          // Configure each asset field
          photoId: {
            entityType: 'client',
            entityId: clientId,
            description: 'Profile photo',
          },
          documentFrontId: {
            entityType: 'client',
            entityId: clientId,
            description: 'Document front',
          },
          documentBackId: {
            entityType: 'client',
            entityId: clientId,
            description: 'Document back',
          },
        },
        {
          deletePrevious: true, // Delete old assets when replacing
          continueOnError: false, // Stop on first error
          onProgress: (field, progress) => {
            console.log(`Uploading ${field}: ${progress}%`);
          },
        }
      );

      // Track uploaded assets for potential cleanup
      uploadedAssetIds = assetResult.uploaded.map(u => u.assetId);

      // Log what happened
      console.log('Assets prepared:', {
        uploaded: assetResult.uploaded.length,
        deleted: assetResult.deleted.length,
        errors: assetResult.errors.length,
      });

      // Step 2: Save the client data with asset IDs
      const dataToSave = {
        ...assetResult.values,
        // Ensure asset fields are strings or null
        photoId: assetResult.values.photoId || null,
        documentFrontId: assetResult.values.documentFrontId || null,
        documentBackId: assetResult.values.documentBackId || null,
      };

      console.log('Saving client data:', dataToSave);
      
      // Example: Update client via SDK
      // await sdk.clients.updateClient(clientId, dataToSave);
      
      // For this example, just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Éxito',
        'Los datos del cliente se han guardado correctamente',
        [{ text: 'OK', onPress: onSuccess }]
      );

      // Reset form to show saved state
      methods.reset(dataToSave);
      
    } catch (error) {
      console.error('Error saving client:', error);
      
      // Cleanup uploaded assets if save failed
      if (uploadedAssetIds.length > 0) {
        console.log('Cleaning up uploaded assets due to error...');
        await cleanupUploadedAssets(sdk, uploadedAssetIds);
      }
      
      Alert.alert(
        'Error',
        'No se pudo guardar los datos del cliente. Por favor intente nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView>
      <FormProvider {...methods}>
        <VStack className="p-4 gap-4">
          {/* Basic Information */}
          <Text className="text-lg font-semibold">Información Básica</Text>
          
          <FormInput
            name="name"
            control={methods.control}
            label="Nombre completo"
            placeholder="Ingrese el nombre completo"
            rules={{
              required: 'El nombre es requerido',
            }}
          />

          <FormInput
            name="email"
            control={methods.control}
            label="Correo electrónico"
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            rules={{
              required: 'El correo es requerido',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Correo electrónico inválido',
              },
            }}
          />

          <FormInput
            name="phone"
            control={methods.control}
            label="Teléfono"
            placeholder="Número de teléfono"
            keyboardType="phone-pad"
          />

          {/* Photo Section */}
          <Text className="text-lg font-semibold mt-4">Fotografías</Text>
          
          <PhotoFieldV2
            name="photoId"
            control={methods.control}
            label="Foto de perfil"
            description="Foto del cliente para identificación"
            aspectRatio={[1, 1]}
            quality={0.8}
            allowsEditing={true}
          />

          {/* Documents Section */}
          <Text className="text-lg font-semibold mt-4">Documentos</Text>
          
          <PhotoFieldV2
            name="documentFrontId"
            control={methods.control}
            label="Documento (Frente)"
            description="Foto del frente del documento de identidad"
            aspectRatio={[4, 3]}
            quality={0.9}
            allowsEditing={false}
          />

          <PhotoFieldV2
            name="documentBackId"
            control={methods.control}
            label="Documento (Reverso)"
            description="Foto del reverso del documento de identidad"
            aspectRatio={[4, 3]}
            quality={0.9}
            allowsEditing={false}
          />

          {/* Submit Button */}
          <Button
            onPress={methods.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="mt-4"
          >
            <ButtonText>
              {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
            </ButtonText>
          </Button>

          {/* Debug Info (remove in production) */}
          {__DEV__ && (
            <VStack className="mt-4 p-3 bg-gray-100 rounded">
              <Text className="text-xs font-mono">
                Form Values: {JSON.stringify(methods.watch(), null, 2)}
              </Text>
            </VStack>
          )}
        </VStack>
      </FormProvider>
    </ScrollView>
  );
}

/**
 * Example of how to use the form in a screen
 */
export function ClientEditScreen({ route, navigation }: any) {
  const clientId = route.params?.clientId;
  const sdk = useGymSdk();
  const [clientData, setClientData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing client data
  useEffect(() => {
    const loadClient = async () => {
      try {
        const client = await sdk.clients.getClient(clientId);
        setClientData({
          name: client.name,
          email: client.email,
          phone: client.phone,
          photoId: client.photoAssetId, // Assuming these fields exist
          documentFrontId: client.documentFrontAssetId,
          documentBackId: client.documentBackAssetId,
        });
      } catch (error) {
        console.error('Error loading client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClient();
  }, [clientId]);

  if (isLoading) {
    return (
      <Center className="flex-1">
        <Spinner size="large" />
      </Center>
    );
  }

  return (
    <ClientFormWithAssets
      clientId={clientId}
      initialData={clientData}
      onSuccess={() => navigation.goBack()}
    />
  );
}