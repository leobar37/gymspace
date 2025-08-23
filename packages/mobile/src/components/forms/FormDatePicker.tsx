import React, { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { CalendarIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { HStack } from '@/components/ui/hstack';

interface FormDatePickerProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<UseControllerProps<TFieldValues>, 'control'> {
  label: string;
  description?: string;
  placeholder?: string;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  control?: UseControllerProps<TFieldValues>['control'];
}

export const FormDatePicker = <TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label,
  description,
  placeholder = 'Seleccionar fecha',
  mode = 'date',
  minimumDate,
  maximumDate,
}: FormDatePickerProps<TFieldValues>) => {
  const formContext = useFormContext<TFieldValues>();
  const { field, fieldState } = useController({
    name,
    control: control || formContext.control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  const [open, setOpen] = useState(false);

  // Ensure we always have a valid date for the DatePicker component
  const isValidDate = (value: unknown): value is Date => {
    return value instanceof Date && !isNaN(value.getTime());
  };

  const dateValue = isValidDate(field.value) ? field.value : new Date();

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return placeholder;

    if (mode === 'date') {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else if (mode === 'time') {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }

    if (event.type === 'set' && selectedDate) {
      field.onChange(selectedDate);
      if (Platform.OS === 'ios') {
        setOpen(false);
      }
    } else if (event.type === 'dismissed') {
      setOpen(false);
    }
  };

  return (
    <FormControl isInvalid={!!fieldState.error}>
      <VStack className="gap-3">
        <Text className="font-medium text-gray-900">{label}</Text>
        {description && (
          <FormControlHelper>
            <FormControlHelperText>{description}</FormControlHelperText>
          </FormControlHelper>
        )}

        <Pressable
          onPress={() => setOpen(true)}
          className="bg-white border border-gray-300 rounded-xl px-4 py-3"
        >
          <HStack className="items-center justify-between">
            <Text className={field.value ? 'text-gray-900' : 'text-gray-400'}>
              {formatDate(field.value)}
            </Text>
            <Icon as={CalendarIcon} className="w-5 h-5 text-gray-400" />
          </HStack>
        </Pressable>

        {open && (
          <DateTimePicker
            value={dateValue}
            mode={mode}
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        )}

        {fieldState.error && (
          <FormControlError>
            <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
          </FormControlError>
        )}
      </VStack>
    </FormControl>
  );
};
