import React from 'react';
import { FormProvider as RHFProvider } from 'react-hook-form';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

interface FormProviderProps extends UseFormReturn<FieldValues> {
  children: React.ReactNode;
}

export function FormProvider<TFieldValues extends FieldValues = FieldValues>({
  children,
  ...props
}: FormProviderProps<TFieldValues>) {
  return (
    <RHFProvider {...props}>
      {children}
    </RHFProvider>
  );
}