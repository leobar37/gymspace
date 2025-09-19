import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, TextInput, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { BottomSheetWrapper, SheetManager, SheetProps } from '@gymspace/sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMultiScreen, useMultiScreenContext } from '@/components/ui/multi-screen';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { 
  ArrowLeft, 
  X as CloseIcon, 
  SearchIcon, 
  UserIcon, 
  PlusIcon,
  CheckIcon 
} from 'lucide-react-native';
import { useClientsController } from '../controllers/clients.controller';
import { useCountryConfig, useDocumentTypes, useDocumentValidator } from '@/config/ConfigContext';
import { useLoadingScreen } from '@/shared/loading-screen';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/forms';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    payload?.currentClientId || null
  );

  const { useClientsList } = useClientsController();

  const { data: clientsData, isLoading, error } = useClientsList({
    search: searchQuery,
    limit: 50,
    page: 0,
  });

  const clients = useMemo(() => {
    return clientsData?.data || [];
  }, [clientsData]);

  const handleSelectClient = useCallback((client: Client) => {
    console.log('handleSelectClient called with client:', client);
    console.log('Current payload:', payload);
    
    if (payload?.mode === 'affiliate' || payload?.mode === 'select') {
      console.log('Mode is:', payload.mode, '- executing onSelect');
      // Immediate selection for affiliation or selection mode
      if (payload.onSelect) {
        console.log('Calling onSelect callback');
        payload.onSelect(client);
      } else {
        console.error('onSelect callback is not defined!');
      }
      SheetManager.hide('client-selector');
    }
  }, [payload]);

  const handleClose = useCallback(() => {
    payload?.onCancel?.();
    SheetManager.hide('client-selector');
  }, [payload]);

  const handleCreateNew = useCallback(() => {
    router.navigate('create');
  }, [router]);

  const renderClient = useCallback(({ item: client }: { item: Client }) => {
    const isSelected = client.id === selectedClientId;
    
    return (
      <Pressable
        onPress={() => handleSelectClient(client)}
        className={`
          px-4 py-3 bg-white
          ${isSelected ? 'bg-blue-50' : ''}
        `}
      >
        <HStack className="items-center justify-between">
          <VStack className="flex-1 gap-0.5">
            <Text className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
              {client.name}
            </Text>
            {client.documentValue && (
              <Text className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                Doc: {client.documentValue}
              </Text>
            )}
            {client.email && (
              <Text className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                {client.email}
              </Text>
            )}
          </VStack>
          {isSelected && (
            <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
              <Icon as={CheckIcon} className="text-white" size="xs" />
            </View>
          )}
        </HStack>
      </Pressable>
    );
  }, [selectedClientId, handleSelectClient]);

  const ListHeader = () => (
    <VStack className="bg-white">
      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="relative">
          <View className="absolute left-3 top-3 z-10">
            <Icon as={SearchIcon} className="text-gray-400" size="sm" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre o documento..."
            placeholderTextColor="#9CA3AF"
            className="bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-base"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Add New Client Button */}
      <Pressable
        onPress={handleCreateNew}
        className="px-4 py-3 bg-white border-b border-gray-100"
      >
        <HStack className="items-center gap-3">
          <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
            <Icon as={PlusIcon} className="text-blue-600" size="sm" />
          </View>
          <Text className="text-blue-600 font-medium">Agregar nuevo cliente</Text>
        </HStack>
      </Pressable>
    </VStack>
  );

  const EmptyComponent = () => (
    <View className="py-12 items-center">
      <Icon as={UserIcon} className="text-gray-300 mb-3" size="xl" />
      <Text className="text-gray-500 text-center">
        {searchQuery ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
      </Text>
      <Button variant="outline" size="sm" onPress={handleCreateNew} className="mt-4">
        <ButtonText>Crear nuevo cliente</ButtonText>
      </Button>
    </View>
  );

  return (
    <>
      <NavigationHeader
        title={payload?.mode === 'affiliate' ? 'Afiliar Cliente' : 'Seleccionar Cliente'}
        subtitle={clients.length > 0 ? `${clients.length} clientes` : undefined}
        onClose={handleClose}
      />
      
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-2 text-gray-500">Cargando clientes...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-red-500 text-center">Error al cargar clientes</Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyComponent}
          contentContainerStyle={{ flexGrow: 1 }}
          ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </>
  );
};

// Quick Create Client Screen
const QuickCreateClientScreen: React.FC = () => {
  const payload = React.useContext(PayloadContext);
  const { router } = useMultiScreenContext();
  const countryConfig = useCountryConfig();
  const documentTypes = useDocumentTypes();
  const validateDocument = useDocumentValidator();
  const { execute } = useLoadingScreen();
  const { createClient } = useClientsController();

  // Get default document type
  const defaultDocumentType = documentTypes[0]?.value || 'dni';

  // Create validation schema
  const schema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    documentValue: z.string().min(1, 'El documento es requerido').refine(
      (value) => {
        const validation = validateDocument(value, defaultDocumentType);
        return validation.isValid;
      },
      {
        message: 'Documento inválido',
      }
    ),
    documentType: z.string().default(defaultDocumentType),
  });

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      documentValue: '',
      documentType: defaultDocumentType,
    },
  });

  const handleClose = useCallback(() => {
    payload?.onCancel?.();
    SheetManager.hide('client-selector');
  }, [payload]);

  const onSubmit = form.handleSubmit(async (data) => {
    await execute({
      action: 'Creando cliente...',
      fn: async () => {
        const createData: CreateClientDto = {
          name: data.name,
          documentValue: data.documentValue,
          documentType: data.documentType,
        };

        createClient(createData, {
          onSuccess: (newClient) => {
            // Select the newly created client
            payload?.onSelect(newClient);
            SheetManager.hide('client-selector');
          },
          onError: (error) => {
            console.error('Error creating client:', error);
          },
        });
      },
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
              Ingrese los datos básicos del cliente. Podrá completar más información después.
            </Text>

            <FormInput
              name="name"
              label="Nombre completo"
              placeholder="Ingrese el nombre del cliente"
              autoCapitalize="words"
            />

            <FormInput
              name="documentValue"
              label={`${documentTypes[0]?.label || 'Documento'}`}
              placeholder={`Ingrese el ${documentTypes[0]?.label?.toLowerCase() || 'documento'}`}
              keyboardType="default"
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
              <Button 
                size="md" 
                onPress={onSubmit} 
                className="flex-1"
              >
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

  console.log('ClientSelectorSheet rendered with props:', props);

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