import React, { createContext, useContext } from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { useProducts, useServices } from '@/features/products/hooks';
import { useCreateSale } from '../hooks/useSales';
import type { Product, Client } from '@gymspace/sdk';
import type { PaymentStatus } from '../types';

export interface SaleDetailsFormData {
  client?: Client;
  customerName?: string;
  notes?: string;
  fileIds: string[];
  paymentMethodId?: string;
  paymentStatus: PaymentStatus;
}

interface NewSaleContextValue {
  // Products and Services data
  products: Product[];
  services: Product[];
  loadingProducts: boolean;
  loadingServices: boolean;

  // API mutations
  createSaleMutation: ReturnType<typeof useCreateSale>;
  
  // Form methods
  formMethods: UseFormReturn<SaleDetailsFormData>;
}

const NewSaleContext = createContext<NewSaleContextValue | undefined>(undefined);

export const useNewSaleContext = () => {
  const context = useContext(NewSaleContext);
  if (!context) {
    throw new Error('useNewSaleContext must be used within NewSaleProvider');
  }
  return context;
};

interface NewSaleProviderProps {
  children: React.ReactNode;
}

export const NewSaleProvider: React.FC<NewSaleProviderProps> = ({ children }) => {
  // Initialize form with default values
  const formMethods = useForm<SaleDetailsFormData>({
    defaultValues: {
      client: undefined,
      customerName: '',
      notes: '',
      fileIds: [],
      paymentMethodId: '',
      paymentStatus: 'paid',
    },
  });

  // Load products and services using the new hooks (up to 100 items each)
  const { data: products = [], isLoading: loadingProducts } = useProducts({
    enabled: true,
  });

  const { data: services = [], isLoading: loadingServices } = useServices({
    enabled: true,
  });

  // Get the create sale mutation
  const createSaleMutation = useCreateSale();

  // Filter only active items for sale
  const activeProducts = products.filter((p) => p.status === 'active');
  const activeServices = services.filter((s) => s.status === 'active');

  const value: NewSaleContextValue = {
    products: activeProducts,
    services: activeServices,
    loadingProducts,
    loadingServices,
    createSaleMutation,
    formMethods,
  };

  return (
    <NewSaleContext.Provider value={value}>
      <FormProvider {...formMethods}>
        {children}
      </FormProvider>
    </NewSaleContext.Provider>
  );
};
