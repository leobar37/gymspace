import { SheetManager } from 'react-native-actions-sheet';

interface ShowAssetPreviewOptions {
  assetId: string;
  onDownload?: (assetId: string) => void;
  onShare?: (assetId: string) => void;
  onClose?: () => void;
}

/**
 * Hook to manage the asset preview sheet
 * @returns Functions to show and hide the asset preview sheet
 */
export const useAssetPreviewSheet = () => {
  const showAssetPreview = async (options: ShowAssetPreviewOptions) => {
    await SheetManager.show('asset-preview', {
      payload: options,
    });
  };

  const hideAssetPreview = async () => {
    await SheetManager.hide('asset-preview');
  };

  return {
    showAssetPreview,
    hideAssetPreview,
  };
};