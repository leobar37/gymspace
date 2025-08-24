import React from 'react';
import { FormProvider as RHFProvider } from 'react-hook-form';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

export interface FormProviderProps<TFieldValues extends FieldValues = FieldValues> extends UseFormReturn<TFieldValues> {
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
