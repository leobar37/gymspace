import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { ChevronDownIcon, XIcon } from 'lucide-react-native';
import { SheetManager } from '@gymspace/sheet';
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
  onClientSelect,
}: ClientSelectorProps<TFieldValues>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { useClientDetail } = useClientsController();

  // Only fetch selected client details when field.value exists and is not empty
  const { data: clientDetailData } = useClientDetail(
    field.value && typeof field.value === 'string' && field.value.length > 0
      ? field.value
      : undefined,
  );

  // Update selectedClient when clientDetailData changes
  useEffect(() => {
    if (clientDetailData) {
      setSelectedClient(clientDetailData);
    } else if (!field.value) {
      setSelectedClient(null);
    }
  }, [clientDetailData, field.value]);

  const handleClear = () => {
    field.onChange('');
    setSelectedClient(null);
    onClientSelect?.(null);
  };

  const openClientSelector = () => {
    if (!enabled) return;

    SheetManager.show('client-selector', {
      mode: 'select',
      currentClientId: field.value,
      onSelect: (client: Client) => {
        field.onChange(client.id);
        setSelectedClient(client);
        onClientSelect?.(client);
      },
    });
  };

  return (
    <FormControl isInvalid={!!fieldState.error}>
      <VStack className="gap-1">
        {label && <Text className="font-medium text-gray-900">{label}</Text>}

        {description && (
          <FormControlHelper>
            <FormControlHelperText>{description}</FormControlHelperText>
          </FormControlHelper>
        )}

        <Pressable onPress={openClientSelector} disabled={!enabled}>
          <View
            className={`
            bg-white 
            border 
            ${fieldState.error ? 'border-red-500' : 'border-gray-300'} 
            rounded-lg 
            px-4
            py-1
            min-h-[50px]
            ${!enabled ? 'opacity-50' : ''}
          `}
          >
            <HStack className="justify-between items-center flex-1">
              {selectedClient ? (
                <VStack className="flex-1 gap-0.5">
                  <Text className="text-gray-900 font-medium">{selectedClient.name}</Text>
                  {selectedClient.documentValue && (
                    <Text className="text-xs text-gray-500">
                      Doc: {selectedClient.documentValue}
                    </Text>
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
  );
}
