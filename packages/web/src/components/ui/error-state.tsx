import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, LucideIcon } from 'lucide-react';

interface ErrorStateProps {
  error: Error;
  icon?: LucideIcon;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  error,
  icon: Icon,
  onRetry,
  retryLabel = 'Reintentar',
}: ErrorStateProps) {
  // Check if it's a permission error (403) or authentication error (401)
  const isPermissionError = error.message?.includes('403') || error.message?.toLowerCase().includes('forbidden');
  const isAuthError = error.message?.includes('401') || error.message?.toLowerCase().includes('unauthorized');
  
  const getTitle = () => {
    if (isPermissionError) return 'Acceso Denegado';
    if (isAuthError) return 'No Autenticado';
    return 'Error al cargar datos';
  };

  const getDescription = () => {
    if (isPermissionError) {
      return 'Esta función requiere permisos de Super Administrador. Solo los administradores del sistema pueden acceder a esta función.';
    }
    if (isAuthError) {
      return 'Por favor, inicia sesión para acceder a esta función.';
    }
    return error.message || 'Ocurrió un error inesperado al cargar los datos.';
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="rounded-full bg-destructive/10 p-3 mb-4">
          <Icon className="size-8 text-destructive" />
        </div>
      )}
      <h3 className="text-lg font-medium mb-2">{getTitle()}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {getDescription()}
      </p>
      {!isPermissionError && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCwIcon className="size-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}