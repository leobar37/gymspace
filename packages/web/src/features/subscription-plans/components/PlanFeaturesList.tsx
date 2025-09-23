'use client';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanFeaturesListProps {
  features: Record<string, any>;
  compact?: boolean;
  className?: string;
}

const featureLabels: Record<string, string> = {
  prioritySupport: 'Priority Support',
  advancedReporting: 'Advanced Reporting',
  customBranding: 'Custom Branding',
  apiAccess: 'API Access',
  multiLocation: 'Multi-Location Support',
  dataExport: 'Data Export',
  dedicatedAccountManager: 'Dedicated Account Manager',
  customIntegrations: 'Custom Integrations',
  whiteLabel: 'White Label',
  ssoIntegration: 'SSO Integration',
};

const formatFeatureKey = (key: string): string => {
  if (featureLabels[key]) {
    return featureLabels[key];
  }
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const renderFeatureValue = (value: any): React.ReactNode => {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckIcon className="size-3 text-green-600" />
    ) : (
      <XIcon className="size-3 text-muted-foreground" />
    );
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return <span className="text-sm">{value}</span>;
  }
  if (value === null || value === undefined) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
  return <span className="text-sm text-muted-foreground">Complex</span>;
};

export function PlanFeaturesList({
  features,
  compact = false,
  className,
}: PlanFeaturesListProps) {
  const featureEntries = Object.entries(features || {});

  if (featureEntries.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No features configured
      </div>
    );
  }

  if (compact) {
    const priorityFeatures = featureEntries
      .filter(([_, value]) => value === true || (typeof value === 'string' && value))
      .slice(0, 3);

    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {priorityFeatures.map(([key, value]) => (
          <Badge
            key={key}
            variant={value === true ? 'default' : 'secondary'}
            className="text-xs"
          >
            {formatFeatureKey(key)}
          </Badge>
        ))}
        {featureEntries.length > priorityFeatures.length && (
          <Badge variant="outline" className="text-xs">
            +{featureEntries.length - priorityFeatures.length} more
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {featureEntries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-sm font-medium">{formatFeatureKey(key)}</span>
          <div className="ml-2">{renderFeatureValue(value)}</div>
        </div>
      ))}
    </div>
  );
}