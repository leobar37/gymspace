import React from 'react';
import { AssetModal } from './AssetModal';

/**
 * Global Asset Modal Component
 * This should be rendered once at the app level to ensure it's within all providers
 */
export function GlobalAssetModal() {
  return <AssetModal />;
}