/**
 * Currency formatting utilities for GymSpace
 * Default currency is PEN (Peruvian Sol)
 */

export const DEFAULT_CURRENCY = 'PEN';
export const DEFAULT_LOCALE = 'es-PE';

/**
 * Format price in PEN currency
 */
export function formatPrice(price: number, currency: string = DEFAULT_CURRENCY): string {
  // Always convert to PEN for our system
  const targetCurrency = DEFAULT_CURRENCY;
  
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: targetCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format price with custom locale and currency (for display purposes)
 */
export function formatPriceCustom(
  price: number, 
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Convert price to PEN if needed (placeholder for future currency conversion)
 */
export function convertToPEN(price: number, fromCurrency: string): number {
  // For now, assume all prices are already in PEN
  // In the future, implement actual currency conversion
  if (fromCurrency === DEFAULT_CURRENCY) {
    return price;
  }
  
  // TODO: Implement actual currency conversion rates
  console.warn(`Currency conversion from ${fromCurrency} to ${DEFAULT_CURRENCY} not implemented`);
  return price;
}

/**
 * Format price range (min - max)
 */
export function formatPriceRange(
  minPrice: number, 
  maxPrice: number, 
  currency: string = DEFAULT_CURRENCY
): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, currency);
  }
  
  return `${formatPrice(minPrice, currency)} - ${formatPrice(maxPrice, currency)}`;
}

/**
 * Parse price string to number (removes currency symbols)
 */
export function parsePrice(priceString: string): number {
  // Remove currency symbols and parse
  const cleanPrice = priceString.replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(cleanPrice) || 0;
}