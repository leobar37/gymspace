import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MultiScreenContext } from './context';
import { StepConfig, MultiScreenStore, MultiScreenRouter, MultiScreenBuilderConfig, NavigationOptions } from './types';

interface MultiScreenProps {
  steps: StepConfig[];
  config?: MultiScreenBuilderConfig;
}

export function MultiScreen({ steps, config }: MultiScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const stepMap = useMemo(() => {
    const map = new Map(steps.map(step => [step.id, step.component]));
    return map;
  }, [steps]);

  const defaultStep = config?.defaultStep || steps[0]?.id;
  const urlParam = config?.urlParam;
  
  // Get initial step from URL or default
  const initialStep = useMemo(() => {
    if (urlParam && typeof params[urlParam] === 'string') {
      const urlStep = params[urlParam] as string;
      if (stepMap.has(urlStep)) {
        return urlStep;
      }
    }
    return defaultStep;
  }, [params, urlParam, defaultStep, stepMap]);

  const [store, setStore] = useState<MultiScreenStore>({
    currentStep: initialStep,
    history: [initialStep],
    props: new Map()
  });

  // Sync URL when step changes
  useEffect(() => {
    if (urlParam && store.currentStep !== params[urlParam]) {
      router.setParams({ [urlParam]: store.currentStep });
    }
  }, [store.currentStep, urlParam, router, params]);

  const navigate = useCallback(<T = any>(stepId: string, options?: NavigationOptions<T>) => {
    if (!stepMap.has(stepId)) {
      console.warn(`Step "${stepId}" not found`);
      return;
    }

    setStore(prevStore => {
      const newProps = new Map(prevStore.props);
      
      if (options?.props) {
        newProps.set(stepId, options.props);
      }

      const newHistory = options?.replace 
        ? [...prevStore.history.slice(0, -1), stepId]
        : [...prevStore.history, stepId];

      return {
        currentStep: stepId,
        history: newHistory,
        props: newProps
      };
    });
  }, [stepMap]);

  const goBack = useCallback(() => {
    setStore(prevStore => {
      if (prevStore.history.length <= 1) return prevStore;
      
      const newHistory = prevStore.history.slice(0, -1);
      const previousStep = newHistory[newHistory.length - 1];
      
      return {
        ...prevStore,
        currentStep: previousStep,
        history: newHistory
      };
    });
  }, []);

  const canGoBack = store.history.length > 1;
  const currentProps = store.props.get(store.currentStep);

  const contextValue: MultiScreenRouter = useMemo(() => ({
    currentStep: store.currentStep,
    navigate,
    goBack,
    canGoBack,
    props: currentProps
  }), [store.currentStep, navigate, goBack, canGoBack, currentProps]);

  const CurrentComponent = stepMap.get(store.currentStep);

  if (!CurrentComponent) {
    console.error(`Component for step "${store.currentStep}" not found`);
    return null;
  }

  return (
    <MultiScreenContext.Provider 
      value={{ 
        router: contextValue, 
        store 
      }}
    >
      <View className="flex-1">
        <CurrentComponent {...(currentProps || {})} />
      </View>
    </MultiScreenContext.Provider>
  );
}