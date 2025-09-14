import { registerSheet, SheetDefinition } from 'react-native-actions-sheet';
import { StockAdjustmentModal } from '@/features/inventory/components/StockAdjustmentModal';
import { StockMovementDetailSheet } from '@/features/inventory/components/StockMovementDetailSheet';
import { StockMovementsSheet } from '@/features/inventory/components/StockMovementsSheet';
import { SalesFiltersSheet } from '@/components/inventory/SalesFiltersSheet';
import { ProductFiltersSheet } from '@/components/inventory/ProductFiltersSheet';
import { ContractsFiltersSheet } from '@/features/contracts/components/ContractsFiltersSheet';
import { ContractRenewalDrawer } from '@/features/contracts/components/ContractRenewalDrawer';
import { ContractFreezeSheet } from '@/features/contracts/components/ContractFreezeSheet';
import { AssetPreviewSheet } from '@/features/assets/components/AssetPreviewSheet';
import AssetSelectorSheet from '@/features/assets/components/AssetSelectorSheet';
import ClientSelectorSheet from '@/features/clients/components/ClientSelectorSheet';
import type { Product, StockMovement, SearchSalesParams, SearchProductsParams, GetContractsParams, Contract, ProductCategory, Client } from '@gymspace/sdk';

// Register the stock adjustment modal
registerSheet('stock-adjustment-modal', StockAdjustmentModal);

// Register the stock movements list sheet
registerSheet('stock-movements', StockMovementsSheet);

// Register the stock movement detail sheet
registerSheet('stock-movement-detail', StockMovementDetailSheet);

// Register the sales filters sheet
registerSheet('sales-filters', SalesFiltersSheet);

// Register the product filters sheet
registerSheet('product-filters', ProductFiltersSheet);

// Register the contracts filters sheet
registerSheet('contracts-filters', ContractsFiltersSheet);

// Register the contract renewal drawer
registerSheet('contract-renewal', ContractRenewalDrawer);

// Register the contract freeze sheet
registerSheet('contract-freeze', ContractFreezeSheet);

// Register the asset preview sheet
registerSheet('asset-preview', AssetPreviewSheet);

// Register the asset selector sheet
registerSheet('asset-selector', AssetSelectorSheet);

// Register the client selector sheet
registerSheet('client-selector', ClientSelectorSheet);

// Define the payload structure for TypeScript intellisense
interface StockAdjustmentForm {
  notes?: string;
  supplierId?: string;
  fileId?: string;
}

interface StockAdjustmentPayload {
  product: Product;
  stockAdjustment: number;
  newStock: number;
  wouldExceedMax: boolean;
  wouldGoBelowMin: boolean;
  onConfirm: (data: StockAdjustmentForm) => Promise<void>;
  onCancel: () => void;
}

// Extend the Sheets interface for TypeScript intellisense
declare module 'react-native-actions-sheet' {
  interface Sheets {
    'stock-adjustment-modal': SheetDefinition<{
      payload: StockAdjustmentPayload;
    }>;
    'stock-movements': SheetDefinition<{
      payload: {
        product: Product;
      };
    }>;
    'stock-movement-detail': SheetDefinition<{
      payload: {
        movement: StockMovement;
      };
    }>;
    'sales-filters': SheetDefinition<{
      payload: {
        currentFilters: SearchSalesParams;
        onApplyFilters: (filters: SearchSalesParams) => void;
      };
    }>;
    'product-filters': SheetDefinition<{
      payload: {
        currentFilters: SearchProductsParams;
        categories: ProductCategory[];
        onApplyFilters: (filters: SearchProductsParams) => void;
      };
    }>;
    'contracts-filters': SheetDefinition<{
      payload: {
        currentFilters: GetContractsParams;
        onApplyFilters: (filters: GetContractsParams) => void;
      };
    }>;
    'contract-renewal': SheetDefinition<{
      payload: {
        contract: Contract;
        onSuccess?: () => void;
      };
    }>;
    'contract-freeze': SheetDefinition<{
      payload: {
        contract: Contract;
        onSuccess?: () => void;
      };
    }>;
    'asset-selector': SheetDefinition<{
      payload: {
        isMulti?: boolean;
        selectedAssets?: string[];
        onSelect?: (assetIds: string[]) => void;
        onCancel?: () => void;
      };
    }>;
    'asset-preview': SheetDefinition<{
      payload: {
        assetId: string;
        onDownload?: (assetId: string) => void;
        onShare?: (assetId: string) => void;
        onDelete?: (assetId: string) => void;
        onClose?: () => void;
      };
    }>;
    'client-selector': SheetDefinition<{
      payload: {
        mode?: 'select' | 'affiliate';
        currentClientId?: string;
        onSelect: (client: Client) => void;
        onCancel?: () => void;
      };
    }>;
  }
}

export {};