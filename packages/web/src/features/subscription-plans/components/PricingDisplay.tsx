'use client';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PricingDisplayProps {
  pricing: {
    PEN?: { currency: 'PEN'; value: number };
    USD?: { currency: 'USD'; value: number };
    COP?: { currency: 'COP'; value: number };
    MXN?: { currency: 'MXN'; value: number };
  };
  billingFrequency?: string;
  compact?: boolean;
  className?: string;
}

const currencySymbols: Record<string, string> = {
  PEN: 'S/',
  USD: '$',
  COP: 'COL$',
  MXN: 'MX$',
};

const formatPrice = (currency: string, value: number): string => {
  const symbol = currencySymbols[currency] || currency;
  if (value === 0) {
    return 'Free';
  }
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

const getBillingFrequencyLabel = (frequency?: string): string => {
  if (!frequency) return '';
  switch (frequency.toLowerCase()) {
    case 'monthly':
      return '/month';
    case 'quarterly':
      return '/quarter';
    case 'yearly':
    case 'annual':
      return '/year';
    default:
      return `/${frequency}`;
  }
};

export function PricingDisplay({
  pricing,
  billingFrequency,
  compact = false,
  className,
}: PricingDisplayProps) {
  const primaryCurrency = pricing.PEN;
  const otherCurrencies = Object.entries(pricing).filter(
    ([key]) => key !== 'PEN' && pricing[key as keyof typeof pricing]
  );

  if (compact) {
    return (
      <div className={cn('space-y-1', className)}>
        {primaryCurrency && (
          <div className="font-medium">
            {formatPrice(primaryCurrency.currency, primaryCurrency.value)}
            <span className="text-xs text-muted-foreground">
              {getBillingFrequencyLabel(billingFrequency)}
            </span>
          </div>
        )}
        {otherCurrencies.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {otherCurrencies.slice(0, 2).map(([currency, price]) => (
              <Badge key={currency} variant="secondary" className="text-xs">
                {formatPrice(price.currency, price.value)}
              </Badge>
            ))}
            {otherCurrencies.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{otherCurrencies.length - 2} more
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {primaryCurrency && (
        <div>
          <span className="text-xs text-muted-foreground">Peru (Primary)</span>
          <div className="text-lg font-semibold">
            {formatPrice(primaryCurrency.currency, primaryCurrency.value)}
            <span className="text-sm font-normal text-muted-foreground">
              {getBillingFrequencyLabel(billingFrequency)}
            </span>
          </div>
        </div>
      )}
      {otherCurrencies.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Other Currencies</span>
          <div className="grid grid-cols-2 gap-2">
            {otherCurrencies.map(([currency, price]) => (
              <div key={currency} className="text-sm">
                <span className="font-medium">
                  {formatPrice(price.currency, price.value)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  {currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!primaryCurrency && otherCurrencies.length === 0 && (
        <div className="text-sm text-muted-foreground">No pricing configured</div>
      )}
    </div>
  );
}