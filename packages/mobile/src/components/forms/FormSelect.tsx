import React from 'react';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText } from '@/components/ui/form-control';
import { 
  Select, 
  SelectTrigger, 
  SelectInput, 
  SelectIcon, 
  SelectPortal, 
  SelectBackdrop, 
  SelectContent, 
  SelectItem, 
  SelectScrollView 
} from '@/components/ui/select';
import { ChevronDownIcon } from 'lucide-react-native';

interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps<TFieldValues extends FieldValues = FieldValues> 
  extends UseControllerProps<TFieldValues> {
  label?: string;
  description?: string;
  placeholder?: string;
  options: SelectOption[];
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'outline' | 'underlined' | 'rounded';
}

export function FormSelect<TFieldValues extends FieldValues = FieldValues>({ 
  name, 
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label, 
  description,
  placeholder = 'Seleccionar opción',
  options,
  isDisabled = false,
  size = 'md',
  variant = 'outline'
}: FormSelectProps<TFieldValues>) {
  const { field, fieldState } = useController({ 
    name, 
    control,
    rules,
    defaultValue,
    shouldUnregister
  });
  
  return (
    <FormControl isInvalid={!!fieldState.error} isDisabled={isDisabled}>
      <VStack className="gap-1">
        {label && <Text className="font-medium text-typography-900">{label}</Text>}
        
        {description && (
          <FormControlHelper>
            <FormControlHelperText>{description}</FormControlHelperText>
          </FormControlHelper>
        )}
        
        <Select 
          selectedValue={field.value}
          onValueChange={(value) => field.onChange(value)}
          isDisabled={isDisabled}
        >
          <SelectTrigger variant={variant} size={size}>
            <SelectInput 
              placeholder={placeholder}
              value={field.value ? options.find(opt => opt.value === field.value)?.label : ''}
            />
            <SelectIcon as={ChevronDownIcon} />
          </SelectTrigger>
          
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectScrollView>
                {options.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    label={option.label} 
                    value={option.value}
                  />
                ))}
              </SelectScrollView>
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