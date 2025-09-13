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
