import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd MMM yyyy', { locale: es });
};

export const formatDateTime = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "dd MMM yyyy 'a las' HH:mm", { locale: es });
};

// Currency formatting utility
export const formatCurrency = (amount: number, currency: string = 'PEN'): string => {
  const currencyOptions: Record<string, { locale: string; code: string }> = {
    PEN: { locale: 'es-PE', code: 'PEN' },
    USD: { locale: 'en-US', code: 'USD' },
    COP: { locale: 'es-CO', code: 'COP' },
    MXN: { locale: 'es-MX', code: 'MXN' },
  };

  const option = currencyOptions[currency] || currencyOptions.PEN;

  return new Intl.NumberFormat(option.locale, {
    style: 'currency',
    currency: option.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
