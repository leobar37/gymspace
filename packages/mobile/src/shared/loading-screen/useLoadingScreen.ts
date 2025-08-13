import { useCallback } from 'react';
import { useLoadingScreenStore } from './store';
import type { UseLoadingScreenOptions, LoadingScreenAction } from './types';

const defaultErrorFormatter = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Ha ocurrido un error inesperado';
};

export const useLoadingScreen = () => {
  const { show, hide, reset } = useLoadingScreenStore();

  const execute = useCallback(
    async <T,>(
      promise: Promise<T>,
      options: UseLoadingScreenOptions = {}
    ): Promise<T | undefined> => {
      const {
        action = 'Procesando...',
        successMessage = 'Operación completada exitosamente',
        errorFormatter = defaultErrorFormatter,
        successActions = [],
        errorActions = [],
        hideOnSuccess = true,
        hideDelay = 1500,
        onSuccess,
        onError,
      } = options;

      try {
        // Show loading state
        show('loading', action);

        // Execute the promise
        const result = await promise;

        // Handle success
        const defaultSuccessActions: LoadingScreenAction[] = hideOnSuccess
          ? []
          : [
              {
                label: 'Aceptar',
                onPress: () => hide(),
                variant: 'solid',
              },
            ];

        const finalSuccessActions = successActions.length > 0 
          ? successActions 
          : defaultSuccessActions;

        show('success', successMessage, finalSuccessActions);

        // Auto-hide on success if configured
        if (hideOnSuccess) {
          setTimeout(() => {
            hide();
          }, hideDelay);
        }

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        // Handle error
        const errorMessage = errorFormatter(error);
        
        const defaultErrorActions: LoadingScreenAction[] = [
          {
            label: 'Reintentar',
            onPress: async () => {
              hide();
              // Re-execute with same options
              setTimeout(() => {
                execute(promise, options);
              }, 300);
            },
            variant: 'solid',
          },
          {
            label: 'Cerrar',
            onPress: () => hide(),
            variant: 'outline',
          },
        ];

        const finalErrorActions = errorActions.length > 0 
          ? errorActions 
          : defaultErrorActions;

        show('error', errorMessage, finalErrorActions);

        // Call error callback if provided
        if (onError) {
          onError(error);
        }

        return undefined;
      }
    },
    [show, hide]
  );

  return {
    execute,
    show,
    hide,
    reset,
  };
};

// Convenience hook for wrapping async functions
export const useAsyncAction = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options: UseLoadingScreenOptions = {}
) => {
  const { execute } = useLoadingScreen();

  return useCallback(
    async (...args: T): Promise<R | undefined> => {
      return execute(asyncFn(...args), options);
    },
    [execute, asyncFn, options]
  );
};