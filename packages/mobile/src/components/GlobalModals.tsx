import React from 'react';
import { GlobalFileModal } from '@/features/files/components/GlobalFileModal';

/**
 * Global modals container
 * Note: Asset selection now uses sheet-based approach (AssetSelectorSheetV2)
 * registered in sheets.tsx and opened via SheetManager.show('asset-selector')
 */
export function GlobalModals() {
  return (
    <>
      <GlobalFileModal />
    </>
  );
}