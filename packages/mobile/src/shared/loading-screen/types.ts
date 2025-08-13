export type LoadingScreenState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingScreenAction {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
}

export interface LoadingScreenConfig {
  action?: string;
  successMessage?: string;
  errorFormatter?: (error: unknown) => string;
  successActions?: LoadingScreenAction[];
  errorActions?: LoadingScreenAction[];
  hideOnSuccess?: boolean;
  hideDelay?: number;
}

export interface LoadingScreenStore {
  state: LoadingScreenState;
  message: string;
  actions: LoadingScreenAction[];
  show: (state: LoadingScreenState, message: string, actions?: LoadingScreenAction[]) => void;
  hide: () => void;
  reset: () => void;
}

export interface UseLoadingScreenOptions extends LoadingScreenConfig {
  onSuccess?: (result: any) => void;
  onError?: (error: unknown) => void;
}