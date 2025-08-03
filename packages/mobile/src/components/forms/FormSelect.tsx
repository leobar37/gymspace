import React from 'react';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { 
  VStack, 
  Text,
  GluestackSelect as Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  Icon
} from '../ui';
import { ChevronDownIcon } from 'lucide-react-native';

interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps<TFieldValues extends FieldValues = FieldValues> 
  extends UseControllerProps<TFieldValues> {
  label: string;
  description?: string;
  placeholder?: string;
  options: SelectOption[];
}

export function FormSelect<TFieldValues extends FieldValues = FieldValues>({ 
  name, 
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label, 
  description,
  placeholder = 'Select an option',
  options
}: FormSelectProps<TFieldValues>) {
  const { field, fieldState } = useController({ 
    name, 
    control,
    rules,
    defaultValue,
    shouldUnregister
  });
  
  return (
    <FormControl isInvalid={!!fieldState.error}>
      <VStack className="gap-1">
        <Text className="font-medium text-gray-900">{label}</Text>
        
        {description && (
          <FormControlHelper>
            <FormControlHelperText>{description}</FormControlHelperText>
          </FormControlHelper>
        )}
        
        <Select
          selectedValue={field.value}
          onValueChange={field.onChange}
        >
          <SelectTrigger onBlur={field.onBlur}>
            <SelectInput placeholder={placeholder} />
            <SelectIcon>
              <Icon as={ChevronDownIcon} />
            </SelectIcon>
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper>
                <SelectDragIndicator />
              </SelectDragIndicatorWrapper>
              {options.map((option) => (
                <SelectItem 
                  key={option.value} 
                  label={option.label} 
                  value={option.value} 
                />
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>
        
        {fieldState.error && (
          <FormControlError>
            <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
          </FormControlError>
        )}
      </VStack>
    </FormControl>
  );
}