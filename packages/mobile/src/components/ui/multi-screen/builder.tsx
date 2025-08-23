/**
 * # MultiScreen V2 Builder para React Native
 * 
 * Sistema de construcción fluida para crear flujos multi-pantalla con navegación y estado integrado.
 * 
 * ## Características Principales
 * - 🎯 **Builder Pattern API**: Interfaz fluida para construir flujos multi-pantalla
 * - 🔄 **Gestión de Estado**: Estado interno eficiente con React hooks
 * - 🌐 **Sincronización URL**: Parámetros de consulta opcionales con Expo Router
 * - 📱 **React Native**: Completamente compatible con React Native y Expo
 * - 🔙 **Navegación con Historial**: Navegación hacia atrás automática
 * - 📦 **Paso de Props**: Transferencia de datos entre pantallas
 * 
 * ## Quick Start
 * 
 * ### 1. Crear flujo básico
 * ```tsx
 * import { createMultiScreen } from '@/components/ui/multi-screen';
 * 
 * const onboardingFlow = createMultiScreen()
 *   .addStep('welcome', WelcomeScreen)
 *   .addStep('user-info', UserInfoScreen)
 *   .addStep('confirmation', ConfirmationScreen)
 *   .build();
 * 
 * export function OnboardingPage() {
 *   const { Component } = onboardingFlow;
 *   return <Component />;
 * }
 * ```
 * 
 * ### 2. Con sincronización URL
 * ```tsx
 * const wizardFlow = createMultiScreen()
 *   .addStep('step1', Step1Component)
 *   .addStep('step2', Step2Component)
 *   .withRouter('wizard-step', 'step1') // URL param y paso default
 *   .build();
 * ```
 * 
 * ### 3. Navegación entre pantallas
 * ```tsx
 * import { useMultiScreenContext } from '@/components/ui/multi-screen';
 * 
 * const MyScreen = () => {
 *   const { router } = useMultiScreenContext();
 *   
 *   return (
 *     <View>
 *       <Button onPress={() => router.navigate('next-step')}>
 *         Siguiente
 *       </Button>
 *       
 *       <Button onPress={() => router.navigate('user-details', { 
 *         props: { userId: 123, name: 'John' } 
 *       })}>
 *         Con datos
 *       </Button>
 *       
 *       <Button onPress={router.goBack} disabled={!router.canGoBack}>
 *         Atrás
 *       </Button>
 *     </View>
 *   );
 * };
 * ```
 * 
 * ### 4. Control externo
 * ```tsx
 * export function ControlledMultiScreen() {
 *   const { Component, useControl } = multiScreenFlow;
 *   const control = useControl();
 *   
 *   return (
 *     <View>
 *       <Button onPress={() => control.setStep('step1')}>Ir a Paso 1</Button>
 *       <Button onPress={control.reset}>Reiniciar</Button>
 *       <Component />
 *       <Text>Paso actual: {control.currentStep}</Text>
 *     </View>
 *   );
 * }
 * ```
 * 
 * ## API Reference
 * 
 * ### MultiScreenBuilder
 * - `addStep<T>(id: string, component: ComponentType<T>)`: Añade paso al flujo
 * - `withRouter(urlParam: string, defaultStep?: string)`: Habilita sincronización URL
 * - `build()`: Construye y retorna `{ Component, useControl }`
 * 
 * ### useMultiScreenContext()
 * ```tsx
 * const { router, store } = useMultiScreenContext();
 * 
 * // router propiedades:
 * router.currentStep      // string: paso actual
 * router.navigate(id, options?)  // navegar a paso
 * router.goBack()         // retroceder
 * router.canGoBack        // boolean: puede retroceder
 * router.props            // datos del paso actual
 * ```
 * 
 * ### NavigationOptions
 * ```tsx
 * interface NavigationOptions<T = any> {
 *   props?: T;        // Datos para pasar a la pantalla destino
 *   replace?: boolean; // Reemplazar historial en lugar de agregar
 * }
 * ```
 * 
 * ## Casos de Uso
 * - ✅ Flujos de onboarding y registro
 * - ✅ Formularios multi-paso complejos
 * - ✅ Configuradores de productos
 * - ✅ Procesos de checkout
 * - ✅ Encuestas y quizzes
 * - ✅ Tutoriales interactivos
 * 
 * ## Arquitectura
 * ```
 * createMultiScreen()
 * └── MultiScreenBuilder
 *     ├── addStep() → StepConfig[]
 *     ├── withRouter() → RouterConfig
 *     └── build() → { Component, useControl }
 *         ├── Component → MultiScreen
 *         │   ├── Context Provider
 *         │   ├── URL Sync (Expo Router)
 *         │   └── Current Step Render
 *         └── useControl → External Control
 * ```
 * 
 * @example Wizard complejo con formularios
 * ```tsx
 * const registrationWizard = createMultiScreen()
 *   .addStep('personal-info', PersonalInfoScreen)
 *   .addStep('address-info', AddressInfoScreen)
 *   .addStep('review', ReviewScreen)
 *   .withRouter('registration-step', 'personal-info')
 *   .build();
 * 
 * // PersonalInfoScreen example
 * const PersonalInfoScreen = () => {
 *   const { router } = useMultiScreenContext();
 *   const { control, handleSubmit } = useForm();
 *   
 *   const handleContinue = (data: any) => {
 *     router.navigate('address-info', { props: { personalData: data } });
 *   };
 *   
 *   return (
 *     <View className="p-4">
 *       <Controller
 *         control={control}
 *         name="firstName"
 *         render={({ field }) => (
 *           <TextInput {...field} placeholder="Nombre" />
 *         )}
 *       />
 *       <Button onPress={handleSubmit(handleContinue)}>
 *         Continuar
 *       </Button>
 *     </View>
 *   );
 * };
 * ```
 */

import { ComponentType, useMemo, useState, useCallback } from 'react';
import { MultiScreen } from './MultiScreen';
import { StepConfig, MultiScreenBuilderConfig, MultiScreenControl } from './types';

export class MultiScreenBuilder {
  private steps: StepConfig[] = [];
  private config: MultiScreenBuilderConfig = {};

  addStep<T = any>(id: string, component: ComponentType<T>): this {
    this.steps.push({ id, component });
    return this;
  }

  withRouter(urlParam: string, defaultStep?: string): this {
    this.config.urlParam = urlParam;
    if (defaultStep) {
      this.config.defaultStep = defaultStep;
    }
    return this;
  }

  build() {
    const steps = [...this.steps];
    const config = { ...this.config };

    // Set default step if not provided
    if (!config.defaultStep && steps.length > 0) {
      config.defaultStep = steps[0].id;
    }

    const Component = () => {
      return <MultiScreen steps={steps} config={config} />;
    };

    const useControl = (): MultiScreenControl => {
      const [currentStep, setCurrentStepState] = useState(config.defaultStep!);
      
      const setStep = useCallback((stepId: string) => {
        const stepExists = steps.some(step => step.id === stepId);
        if (stepExists) {
          setCurrentStepState(stepId);
        } else {
          console.warn(`Step "${stepId}" not found`);
        }
      }, []);

      const reset = useCallback(() => {
        setCurrentStepState(config.defaultStep!);
      }, []);

      return useMemo(() => ({
        currentStep,
        setStep,
        reset
      }), [currentStep, setStep, reset]);
    };

    return { Component, useControl };
  }
}

export function createMultiScreen(): MultiScreenBuilder {
  return new MultiScreenBuilder();
}