import React from 'react';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { 
  VStack,
  Text,
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioIcon,
  RadioLabel,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  Icon
} from '../ui';
import { CircleIcon } from 'lucide-react-native';

interface RadioOption {
  label: string;
  value: string;
}

interface FormRadioProps<TFieldValues extends FieldValues = FieldValues> 
  extends UseControllerProps<TFieldValues> {
  label: string;
  description?: string;
  options: RadioOption[];
}

export function FormRadio<TFieldValues extends FieldValues = FieldValues>({ 
  name, 
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label, 
  description,
  options
}: FormRadioProps<TFieldValues>) {
  const { field, fieldState } = useController({ 
    name, 
    control,
    rules,
    defaultValue,
    shouldUnregister
  });
  
  return (
    <FormControl isInvalid={!!fieldState.error}>
      <VStack className="gap-2">
        <Text className="font-medium text-gray-900">{label}</Text>
        
        {description && (
          <FormControlHelper>
            <FormControlHelperText>{description}</FormControlHelperText>
          </FormControlHelper>
        )}
        
        <RadioGroup 
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
        >
          <VStack className="gap-2">
            {options.map((option) => (
              <Radio key={option.value} value={option.value}>
                <RadioIndicator>
                  <RadioIcon as={CircleIcon} />
                </RadioIndicator>
                <RadioLabel>{option.label}</RadioLabel>
              </Radio>
            ))}
          </VStack>
        </RadioGroup>
        
        {fieldState.error && (
          <FormControlError>
            <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
          </FormControlError>
        )}
      </VStack>
    </FormControl>
  );
}