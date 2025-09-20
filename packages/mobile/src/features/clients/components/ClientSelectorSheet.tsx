import React, { useCallback } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { BottomSheetWrapper, SheetManager, SheetProps } from '@gymspace/sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMultiScreen, useMultiScreenContext } from '@/components/ui/multi-screen';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ArrowLeft, X as CloseIcon } from 'lucide-react-native';
import { useDocumentTypes, useDocumentValidator } from '@/config/ConfigContext';
import { useLoadingScreen } from '@/shared/loading-screen';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/forms';
import { ClientsListGeneric } from './ClientsList.generic';
import { useClientsController } from '../controllers/clients.controller';
import type { Client, CreateClientDto } from '@gymspace/sdk';

export interface ClientSelectorPayload {
  mode?: 'select' | 'affiliate';
  currentClientId?: string;
  onSelect: (client: Client) => void;
  onCancel?: () => void;
}

// Context for payload
const PayloadContext = React.createContext<ClientSelectorPayload | undefined>(undefined);

// Navigation Header Component
interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({ title, subtitle, onClose }) => {
  const { router } = useMultiScreenContext();
  const canGoBack = router.canGoBack;

  return (
    <View className="px-4 py-3 border-b border-gray-200 bg-white">
      <HStack className="items-center justify-between">
        {/* Left side - Back button or empty space */}
        <View className="w-10">
          {canGoBack && (
            <Button variant="link" size="sm" onPress={() => router.goBack()} className="p-0">
              <Icon as={ArrowLeft} className="text-gray-700" size="md" />
            </Button>
          )}
        </View>

        {/* Center - Title */}
        <View className="flex-1 items-center">
          <Text className="text-base font-semibold text-gray-900">{title}</Text>
          {subtitle && <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>}
        </View>

        {/* Right side - Close button */}
        <View className="w-10">
          <Button variant="link" size="sm" onPress={onClose} className="p-0">
            <Icon as={CloseIcon} className="text-gray-700" size="md" />
          </Button>
        </View>
      </HStack>
    </View>
  );
};

// Client List Screen
const ClientListScreen: React.FC = () => {
  const payload = React.useContext(PayloadContext);
  const { router } = useMultiScreenContext();

  const handleSelectClient = useCallback(
    (client: Client) => {
      console.log('Client selected:', payload);

      if (payload?.mode === 'affiliate' || payload?.mode === 'select') {
        if (payload.onSelect) {
          console.log('Calling onSelect callback');
          payload.onSelect(client);
        } else {
          console.error('onSelect callback is not defined!');
        }
        SheetManager.hide('client-selector');
      }
    },
    [payload],
  );

  const handleClose = useCallback(() => {
    payload?.onCancel?.();
    SheetManager.hide('client-selector');
  }, [payload]);

  const handleCreateNew = useCallback(() => {
    router.navigate('create');
  }, [router]);

  return (
    <>
      <NavigationHeader
        title={payload?.mode === 'affiliate' ? 'Afiliar Cliente' : 'Seleccionar Cliente'}
        onClose={handleClose}
      />
      <ClientsListGeneric
        selectedClientId={payload?.currentClientId}
        onClientSelect={handleSelectClient}
        activeOnly={false}
        searchPlaceholder="Buscar por nombre, email o documento..."
        showAddButton={true}
        onAddClient={handleCreateNew}
        isSheet={true}
        emptyMessage={
          payload?.mode === 'affiliate'
            ? 'No hay clientes disponibles para afiliar'
            : 'No hay clientes disponibles'
        }
      />
    </>
  );
};

// Quick Create Client Screen
const QuickCreateClientScreen: React.FC = () => {
  const payload = React.useContext(PayloadContext);
  const { router } = useMultiScreenContext();
  const documentTypes = useDocumentTypes();
  const validateDocument = useDocumentValidator();
  const { execute } = useLoadingScreen();
  const { createClientWithCallbacks } = useClientsController();

  // Get default document type
  const defaultDocumentType = documentTypes[0]?.value || 'dni';

  // Create validation schema
  const schema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    documentValue: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (!value || value.trim() === '') return true; // Optional field
          const validation = validateDocument(defaultDocumentType, value);
          return validation.isValid;
        },
        {
          message: 'Documento inválido',
        },
      ),
    documentType: z.string().default(defaultDocumentType),
    phone: z.string().optional(),
  });

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      documentValue: '',
      documentType: defaultDocumentType,
      phone: '',
    },
  });

  const handleClose = useCallback(() => {
    payload?.onCancel?.();
    SheetManager.hide('client-selector');
  }, [payload]);

  const onSubmit = form.handleSubmit(async (data) => {
    const createPromise = new Promise<void>((resolve, reject) => {
      const createData: CreateClientDto = {
        name: data.name,
        address: '', // Required field in SDK
        ...(data.documentValue && { documentValue: data.documentValue }),
        ...(data.documentType && { documentType: data.documentType }),
        ...(data.phone && { phone: data.phone }),
      };

      createClientWithCallbacks(createData, {
        onSuccess: (newClient) => {
          // Navigate back to list to show the updated data
          router.navigate('list');

          // Select the newly created client
          payload?.onSelect(newClient);
          SheetManager.hide('client-selector');
          resolve();
        },
        onError: (error) => {
          console.error('Error creating client:', error);
          reject(error);
        },
      });
    });

    await execute(createPromise, {
      action: 'Creando cliente...',
      successMessage: 'Cliente creado correctamente',
    });
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <NavigationHeader
        title="Nuevo Cliente Rápido"
        subtitle="Información básica"
        onClose={handleClose}
      />

      <FormProvider {...form}>
        <View className="flex-1 px-4 py-4">
          <VStack className="gap-4">
            <Text className="text-sm text-gray-600">
              Ingrese los datos básicos del cliente. El documento y teléfono son opcionales. Podrá
              completar más información después.
            </Text>

            <FormInput
              name="name"
              label="Nombre completo"
              placeholder="Ingrese el nombre del cliente"
              autoCapitalize="words"
            />

            <FormInput
              name="documentValue"
              label={`${documentTypes[0]?.label || 'Documento'} (opcional)`}
              placeholder={`Ingrese el ${documentTypes[0]?.label?.toLowerCase() || 'documento'}`}
              keyboardType="default"
              autoCapitalize="none"
            />

            <FormInput
              name="phone"
              label="Teléfono (opcional)"
              placeholder="Ingrese el número de teléfono"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </VStack>

          <View className="mt-auto pt-4">
            <HStack className="gap-3">
              <Button
                variant="outline"
                size="md"
                onPress={() => router.goBack()}
                className="flex-1"
              >
                <ButtonText>Cancelar</ButtonText>
              </Button>
              <Button size="md" onPress={onSubmit} className="flex-1">
                <ButtonText>Crear Cliente</ButtonText>
              </Button>
            </HStack>
          </View>
        </View>
      </FormProvider>
    </KeyboardAvoidingView>
  );
};

// Create MultiScreen flow
const clientSelectorFlow = createMultiScreen()
  .addStep('list', ClientListScreen)
  .addStep('create', QuickCreateClientScreen)
  .build();

const { Component } = clientSelectorFlow;

// Main Sheet Component
interface ClientSelectorSheetProps extends SheetProps, ClientSelectorPayload {}

function ClientSelectorSheet(props: ClientSelectorSheetProps) {
  const insets = useSafeAreaInsets();

  console.log('prosp', props);

  return (
    <BottomSheetWrapper
      sheetId="client-selector"
      snapPoints={['85%']}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: 'white',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
      handleIndicatorStyle={{
        backgroundColor: '#D1D5DB',
        width: 100,
        height: 4,
      }}
    >
      <View
        style={{
          height: '100%',
          paddingBottom: insets.bottom || 20,
        }}
      >
        <PayloadContext.Provider value={props}>
          <Component />
        </PayloadContext.Provider>
      </View>
    </BottomSheetWrapper>
  );
}

export default ClientSelectorSheet;
