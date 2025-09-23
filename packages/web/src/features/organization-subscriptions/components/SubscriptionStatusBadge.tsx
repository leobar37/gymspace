import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  MinusCircleIcon,
  ClockIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export type SubscriptionStatus = 'active' | 'expired' | 'expiring_soon' | 'inactive';

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
  endDate?: Date;
  daysRemaining?: number;
  compact?: boolean;
}

export function SubscriptionStatusBadge({
  status,
  endDate,
  daysRemaining,
  compact = false
}: SubscriptionStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: 'Activo',
          variant: 'success' as const,
          icon: CheckCircleIcon,
          className: 'bg-green-50 text-green-700 border-green-200',
        };
      case 'expired':
        return {
          label: 'Expirado',
          variant: 'destructive' as const,
          icon: XCircleIcon,
          className: 'bg-red-50 text-red-700 border-red-200',
        };
      case 'expiring_soon':
        return {
          label: 'Por expirar',
          variant: 'warning' as const,
          icon: AlertTriangleIcon,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        };
      case 'inactive':
      default:
        return {
          label: 'Inactivo',
          variant: 'secondary' as const,
          icon: MinusCircleIcon,
          className: 'bg-gray-50 text-gray-700 border-gray-200',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <Badge
        variant={config.variant}
        className={cn('flex items-center gap-1', config.className)}
      >
        <Icon className="size-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant={config.variant}
        className={cn('flex items-center gap-1.5 w-fit', config.className)}
      >
        <Icon className="size-3.5" />
        <span>{config.label}</span>
      </Badge>

      {/* Additional info based on status */}
      {status === 'active' && daysRemaining !== undefined && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ClockIcon className="size-3" />
          <span>{daysRemaining} días restantes</span>
        </div>
      )}

      {status === 'expiring_soon' && daysRemaining !== undefined && (
        <div className="flex items-center gap-1 text-xs text-yellow-700 font-medium">
          <AlertTriangleIcon className="size-3" />
          <span>Expira en {daysRemaining} días</span>
        </div>
      )}

      {endDate && (status === 'expired' || status === 'expiring_soon') && (
        <div className="text-xs text-muted-foreground">
          {status === 'expired' ? 'Expiró el' : 'Expira el'} {format(new Date(endDate), 'dd MMM yyyy', { locale: es })}
        </div>
      )}
    </div>
  );
}