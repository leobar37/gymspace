import { ComponentType } from 'react';

export interface StepConfig<T = any> {
  id: string;
  component: ComponentType<T>;
}

export interface NavigationOptions<T = any> {
  props?: T;
  replace?: boolean;
}

export interface MultiScreenRouter {
  currentStep: string;
  navigate: <T = any>(stepId: string, options?: NavigationOptions<T>) => void;
  goBack: () => void;
  canGoBack: boolean;
  props: any;
}

export interface MultiScreenControl {
  currentStep: string;
  setStep: (stepId: string) => void;
  reset: () => void;
}

export interface MultiScreenStore {
  currentStep: string;
  history: string[];
  props: Map<string, any>;
}

export interface MultiScreenContextValue {
  router: MultiScreenRouter;
  store: MultiScreenStore;
}

export interface MultiScreenBuilderConfig {
  urlParam?: string;
  defaultStep?: string;
}