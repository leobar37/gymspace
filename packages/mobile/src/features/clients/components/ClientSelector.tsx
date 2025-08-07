import React, { useState, useMemo, useEffect } from 'react';
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
import { ChevronDownIcon, XIcon, SearchIcon, UserIcon } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { useClientsController } from '../controllers/clients.controller';
import type { Client } from '@gymspace/sdk';

interface ClientSelectorProps<TFieldValues extends FieldValues = FieldValues> 
  extends UseControllerProps<TFieldValues> {
  label?: string;
  description?: string;
  placeholder?: string;
  enabled?: boolean;
  allowClear?: boolean;
  onClientSelect?: (client: Client | null) => void;
}

export function ClientSelector<TFieldValues extends FieldValues = FieldValues>({ 
  name, 
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label = 'Cliente', 
  description,
  placeholder = 'Seleccionar cliente',
  enabled = true,
  allowClear = false,
  onClientSelect
}: ClientSelectorProps<TFieldValues>) {
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
  
  const { useClientsList, useClientDetail } = useClientsController();
  
  // Fetch clients list with search
  const { data: clientsData, isLoading, error } = useClientsList({
    search: searchQuery,
    limit: 50
  });
  
  // Fetch selected client details
  const { data: selectedClient } = useClientDetail(field.value as string);
  
  const clients = useMemo(() => {
    return clientsData?.data || [];
  }, [clientsData]);
  
  const handleSave = () => {
    field.onChange(tempValue);
    const selectedClient = clients.find(c => c.id === tempValue);
    onClientSelect?.(selectedClient || null);
    setShowModal(false);
  };
  
  const handleCancel = () => {
    setTempValue(field.value || '');
    setSearchQuery('');
    setShowModal(false);
  };
  
  const handleClear = () => {
    field.onChange('');
    onClientSelect?.(null);
  };
  
  const openModal = () => {
    if (enabled) {
      setTempValue(field.value || '');
      setSearchQuery('');
      setShowModal(true);
    }
  };
  
  const handleClientPress = (clientId: string) => {
    setTempValue(clientId);
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
                {selectedClient ? (
                  <VStack className="flex-1 gap-0.5">
                    <Text className="text-gray-900 font-medium">{selectedClient.name}</Text>
                    {selectedClient.documentValue && (
                      <Text className="text-xs text-gray-500">Doc: {selectedClient.documentValue}</Text>
                    )}
                  </VStack>
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
                  {label || 'Seleccionar cliente'}
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
                  placeholder="Buscar por nombre o documento..."
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-base"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            
            {/* Clients List */}
            <ScrollView className="flex-1 px-6">
              {isLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="mt-2 text-gray-500">Cargando clientes...</Text>
                </View>
              ) : error ? (
                <View className="py-8 items-center">
                  <Text className="text-red-500">Error al cargar clientes</Text>
                </View>
              ) : clients.length === 0 ? (
                <View className="py-8 items-center">
                  <Icon as={UserIcon} className="text-gray-300 mb-2" size="xl" />
                  <Text className="text-gray-500">
                    {searchQuery ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
                  </Text>
                </View>
              ) : (
                <VStack className="py-2 gap-1">
                  {clients.map((client) => (
                    <Pressable
                      key={client.id}
                      onPress={() => handleClientPress(client.id)}
                      className={`
                        p-4 rounded-lg border
                        ${tempValue === client.id 
                          ? 'bg-blue-50 border-blue-400' 
                          : 'bg-white border-gray-200'
                        }
                      `}
                    >
                      <VStack className="gap-1">
                        <HStack className="justify-between items-start">
                          <VStack className="flex-1 gap-0.5">
                            <Text className={`font-medium ${
                              tempValue === client.id ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {client.name}
                            </Text>
                            {client.email && (
                              <Text className={`text-xs ${
                                tempValue === client.id ? 'text-blue-700' : 'text-gray-500'
                              }`}>
                                {client.email}
                              </Text>
                            )}
                            {client.documentValue && (
                              <Text className={`text-xs ${
                                tempValue === client.id ? 'text-blue-700' : 'text-gray-500'
                              }`}>
                                Doc: {client.documentValue}
                              </Text>
                            )}
                          </VStack>
                          {tempValue === client.id && (
                            <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                              <Text className="text-white text-xs">✓</Text>
                            </View>
                          )}
                        </HStack>
                        {client.status !== 'active' && (
                          <Text className="text-xs text-orange-600 font-medium mt-1">
                            Cliente Inactivo
                          </Text>
                        )}
                      </VStack>
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