import { create } from 'zustand';

interface AssetPreviewState {
  isVisible: boolean;
  assetId: string | null;
  showPreview: (assetId: string) => void;
  hidePreview: () => void;
}

export const useAssetPreviewStore = create<AssetPreviewState>((set) => ({
  isVisible: false,
  assetId: null,
  showPreview: (assetId: string) => {
    console.log('[AssetPreviewStore] showPreview called with:', assetId);
    set({ isVisible: true, assetId });
  },
  hidePreview: () => {
    console.log('[AssetPreviewStore] hidePreview called');
    set({ isVisible: false, assetId: null });
  },
}));