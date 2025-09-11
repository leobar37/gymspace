import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  onRefresh?: () => void;
  refreshLabel?: string;
}

export function EmptyState({
  icon: Icon,
  title = 'No hay datos',
  description = 'No se encontraron registros. Intenta ajustar los filtros o actualizar la página.',
  onRefresh,
  refreshLabel = 'Actualizar',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && <Icon className="size-12 text-muted-foreground mb-4" />}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {description}
      </p>
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCwIcon className="size-4 mr-2" />
          {refreshLabel}
        </Button>
      )}
    </div>
  );
}