import React from 'react';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText } from '@/components/ui/form-control';
import type { ComponentProps } from 'react';

interface FormTextareaProps extends Omit<ComponentProps<typeof TextareaInput>, 'ref'> {
  label: string;
  error?: string;
  isRequired?: boolean;
  description?: string;
}

export function FormTextarea({ 
  label, 
  error,
  isRequired,
  description, 
  ...props 
}: FormTextareaProps) {
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      <VStack className="gap-1">
        <Text className="font-medium text-gray-900">{label}</Text>
        
        {description && (
          <FormControlHelper>
            <FormControlHelperText>{description}</FormControlHelperText>
          </FormControlHelper>
        )}
        
        <Textarea>
          <TextareaInput
            {...props}
          />
        </Textarea>
        
        {error && (
          <FormControlError>
            <FormControlErrorText>{error}</FormControlErrorText>
          </FormControlError>
        )}
      </VStack>
    </FormControl>
  );
}