export interface DocumentType {
  value: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  documentTypes: DocumentType[];
  dateFormat: string;
  phoneFormat: string;
  phonePrefix: string;
  currency: string;
  currencySymbol: string;
  currencyLocale: string;
}

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  PE: {
    code: 'PE',
    name: 'Peru',
    documentTypes: [
      {
        value: 'DNI',
        label: 'DNI',
        placeholder: '12345678',
        maxLength: 8,
        pattern: '^[0-9]{8}$',
      },
      {
        value: 'RUC',
        label: 'RUC',
        placeholder: '10123456789',
        maxLength: 11,
        pattern: '^[0-9]{11}$',
      },
      {
        value: 'CE',
        label: 'Carnet de Extranjería',
        placeholder: '001234567',
        maxLength: 12,
        pattern: '^[A-Z0-9]{9,12}$',
      },
      {
        value: 'PASSPORT',
        label: 'Pasaporte',
        placeholder: 'ABC123456',
        maxLength: 20,
      },
    ],
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '999 999 999',
    phonePrefix: '+51',
    currency: 'PEN',
    currencySymbol: 'S/',
    currencyLocale: 'es-PE',
  },
  EC: {
    code: 'EC',
    name: 'Ecuador',
    documentTypes: [
      {
        value: 'CEDULA',
        label: 'Cédula de Identidad',
        placeholder: '1234567890',
        maxLength: 10,
        pattern: '^[0-9]{10}$',
      },
      {
        value: 'RUC',
        label: 'RUC',
        placeholder: '1234567890001',
        maxLength: 13,
        pattern: '^[0-9]{13}$',
      },
      {
        value: 'PASSPORT',
        label: 'Pasaporte',
        placeholder: 'ABC123456',
        maxLength: 20,
      },
    ],
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '099 999 9999',
    phonePrefix: '+593',
    currency: 'USD',
    currencySymbol: '$',
    currencyLocale: 'es-EC',
  },
  MX: {
    code: 'MX',
    name: 'Mexico',
    documentTypes: [
      {
        value: 'CURP',
        label: 'CURP',
        placeholder: 'ABCD123456HDFGHI01',
        maxLength: 18,
        pattern: '^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z]{2}$',
      },
      {
        value: 'RFC',
        label: 'RFC',
        placeholder: 'ABCD123456ABC',
        maxLength: 13,
        pattern: '^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$',
      },
      {
        value: 'INE',
        label: 'INE/IFE',
        placeholder: '1234567890123',
        maxLength: 13,
        pattern: '^[0-9]{13}$',
      },
      {
        value: 'PASSPORT',
        label: 'Pasaporte',
        placeholder: 'ABC123456',
        maxLength: 20,
      },
    ],
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '55 1234 5678',
    phonePrefix: '+52',
    currency: 'MXN',
    currencySymbol: '$',
    currencyLocale: 'es-MX',
  },
  // Default configuration for other countries
  DEFAULT: {
    code: 'DEFAULT',
    name: 'Default',
    documentTypes: [
      {
        value: 'ID',
        label: 'Identification Document',
        placeholder: '123456789',
        maxLength: 20,
      },
      {
        value: 'PASSPORT',
        label: 'Passport',
        placeholder: 'ABC123456',
        maxLength: 20,
      },
      {
        value: 'TAX_ID',
        label: 'Tax ID',
        placeholder: '123-45-6789',
        maxLength: 20,
      },
    ],
    dateFormat: 'MM/DD/YYYY',
    phoneFormat: '(999) 999-9999',
    phonePrefix: '+1',
    currency: 'USD',
    currencySymbol: '$',
    currencyLocale: 'en-US',
  },
};

export function getCountryConfig(countryCode?: string): CountryConfig {
  if (!countryCode) {
    return COUNTRY_CONFIGS.DEFAULT;
  }
  
  const upperCode = countryCode.toUpperCase();
  return COUNTRY_CONFIGS[upperCode] || COUNTRY_CONFIGS.DEFAULT;
}

export function getDocumentTypes(countryCode?: string): DocumentType[] {
  const config = getCountryConfig(countryCode);
  return config.documentTypes;
}

export function validateDocument(
  documentType: string,
  documentValue: string,
  countryCode?: string
): { isValid: boolean; error?: string } {
  const config = getCountryConfig(countryCode);
  const docType = config.documentTypes.find((dt) => dt.value === documentType);
  
  if (!docType) {
    return { isValid: false, error: 'Invalid document type' };
  }
  
  if (docType.maxLength && documentValue.length > docType.maxLength) {
    return { isValid: false, error: `Maximum length is ${docType.maxLength}` };
  }
  
  if (docType.pattern) {
    const regex = new RegExp(docType.pattern);
    if (!regex.test(documentValue)) {
      return {
        isValid: false,
        error: `Invalid format for ${docType.label}`,
      };
    }
  }
  
  return { isValid: true };
}

export function formatPrice(amount: number, countryCode?: string): string {
  const config = getCountryConfig(countryCode);
  
  try {
    return new Intl.NumberFormat(config.currencyLocale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback to currency symbol + formatted number
    const formattedNumber = new Intl.NumberFormat(config.currencyLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${config.currencySymbol}${formattedNumber}`;
  }
}