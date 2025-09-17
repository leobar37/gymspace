import { useCallback } from 'react';
import { SheetManager } from '../SheetManager';

export function useSheet(sheetId: string) {
  const show = useCallback(
    (props?: any) => {
      SheetManager.show(sheetId, props);
    },
    [sheetId]
  );

  const hide = useCallback(() => {
    SheetManager.hide(sheetId);
  }, [sheetId]);

  const isRegistered = useCallback(() => {
    return SheetManager.isRegistered(sheetId);
  }, [sheetId]);

  return {
    show,
    hide,
    isRegistered,
  };
}