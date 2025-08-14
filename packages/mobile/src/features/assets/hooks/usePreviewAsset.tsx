// DEPRECATED: This hook is deprecated in favor of the global asset preview store
// Use useAssetPreviewStore from '../stores/asset-preview.store' instead

import { useAssetPreviewStore } from '../stores/asset-preview.store';

/**
 * @deprecated Use useAssetPreviewStore instead for better performance and state management
 */
export const usePreviewAsset = () => {
  const store = useAssetPreviewStore();
  
  return {
    showPreview: store.showPreview,
    hidePreview: store.hidePreview,
    PreviewModal: () => null, // Modal is now global in AppProviders
    isPreviewVisible: store.isVisible,
    currentAssetId: store.assetId,
  };
};

/**
 * @deprecated Use AssetPreviewGlobal in AppProviders instead
 */
export const AssetPreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};