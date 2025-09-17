import { useCallback } from 'react';
import { SheetManager } from '../SheetManager';

export function useSheetManager() {
  const show = useCallback((sheetId: string, props?: any) => {
    SheetManager.show(sheetId, props);
  }, []);

  const hide = useCallback((sheetId: string) => {
    SheetManager.hide(sheetId);
  }, []);

  const hideAll = useCallback(() => {
    SheetManager.hideAll();
  }, []);

  const register = useCallback(
    (id: string, component: React.ComponentType<any>, options?: any) => {
      SheetManager.register(id, component, options);
    },
    []
  );

  const unregister = useCallback((id: string) => {
    SheetManager.unregister(id);
  }, []);

  const isRegistered = useCallback((id: string) => {
    return SheetManager.isRegistered(id);
  }, []);

  return {
    show,
    hide,
    hideAll,
    register,
    unregister,
    isRegistered,
  };
}