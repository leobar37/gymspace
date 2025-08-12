import React, { createContext, useContext, useMemo } from 'react';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import {
  CountryConfig,
  DocumentType,
  getCountryConfig,
  getDocumentTypes,
  validateDocument,
  formatPrice as formatPriceBase,
} from './config';

interface ConfigContextValue {
  countryConfig: CountryConfig;
  documentTypes: DocumentType[];
  validateDocument: (
    documentType: string,
    documentValue: string
  ) => { isValid: boolean; error?: string };
  getCountryCode: () => string | undefined;
  formatPrice: (amount: number) => string;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useCurrentSession();

  // Get country code from gym or organization settings - stable reference
  const organizationCountry = organization?.country;
  
  const countryCode = useMemo(() => {
    // First check organization settings for country (this is where country is stored)
    if (organizationCountry) {
      return organizationCountry as string;
    }
    // Default to Peru as an example
    return 'PE';
  }, [organizationCountry]);

  const contextValue = useMemo(
    () => ({
      countryConfig: getCountryConfig(countryCode),
      documentTypes: getDocumentTypes(countryCode),
      validateDocument: (documentType: string, documentValue: string) =>
        validateDocument(documentType, documentValue, countryCode),
      getCountryCode: () => countryCode,
      formatPrice: (amount: number) => formatPriceBase(amount, countryCode),
    }),
    [countryCode]
  );

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

// Export specific hooks for convenience
export function useDocumentTypes() {
  const { documentTypes } = useConfig();
  return documentTypes;
}

export function useCountryConfig() {
  const { countryConfig } = useConfig();
  return countryConfig;
}

export function useDocumentValidator() {
  const { validateDocument } = useConfig();
  return validateDocument;
}

export function useFormatPrice() {
  const { formatPrice } = useConfig();
  return formatPrice;
}