import React from 'react';
import { GlobalAssetModal } from '@/features/assets/components/GlobalAssetModal';
import { GlobalFileModal } from '@/features/files/components/GlobalFileModal';

export function GlobalModals() {
  return (
    <>
      <GlobalAssetModal />
      <GlobalFileModal />
    </>
  );
}