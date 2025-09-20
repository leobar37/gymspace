import { ProductFiltersSheet } from '@/components/inventory/ProductFiltersSheet';
import { SalesFiltersSheet } from '@/components/inventory/SalesFiltersSheet';
import { AssetPreviewSheet } from '@/features/assets/components/AssetPreviewSheet';
import AssetSelectorSheet from '@/features/assets/components/AssetSelectorSheet';
import ClientSelectorSheet from '@/features/clients/components/ClientSelectorSheet';
import { ContractFreezeSheet } from '@/features/contracts/components/ContractFreezeSheet';
import { ContractRenewalDrawer } from '@/features/contracts/components/ContractRenewalDrawer';
import { ContractsFiltersSheet } from '@/features/contracts/components/ContractsFiltersSheet';
import { CheckInSheet } from '@/features/dashboard/components/CheckInSheet';
import { StockAdjustmentModal } from '@/features/inventory/components/StockAdjustmentModal';
import { StockMovementDetailSheet } from '@/features/inventory/components/StockMovementDetailSheet';
import { StockMovementsSheet } from '@/features/inventory/components/StockMovementsSheet';
import { SalePaymentSheet } from '@/features/sales/components/SalePaymentSheet';
import { SheetManager } from '@gymspace/sheet';

// Register the stock adjustment modal
SheetManager.register('stock-adjustment-modal', StockAdjustmentModal);

// Register the stock movements list sheet
SheetManager.register('stock-movements', StockMovementsSheet);

// Register the stock movement detail sheet
SheetManager.register('stock-movement-detail', StockMovementDetailSheet);

// Register the sales filters sheet
SheetManager.register('sales-filters', SalesFiltersSheet);

// Register the product filters sheet
SheetManager.register('product-filters', ProductFiltersSheet);

// Register the contracts filters sheet
SheetManager.register('contracts-filters', ContractsFiltersSheet);

// Register the contract renewal drawer
SheetManager.register('contract-renewal', ContractRenewalDrawer);

// Register the contract freeze sheet
SheetManager.register('contract-freeze', ContractFreezeSheet);

// Register the asset preview sheet
SheetManager.register('asset-preview', AssetPreviewSheet);

// Register the asset selector sheet
SheetManager.register('asset-selector', AssetSelectorSheet);

// Register the client selector sheet
SheetManager.register('client-selector', ClientSelectorSheet);

// Register the check-in sheet
SheetManager.register('check-in', CheckInSheet);

// Register the sale payment sheet
SheetManager.register('sale-payment', SalePaymentSheet);

console.log(
  'load sheets',
  JSON.stringify(
    {
      keys: Array.from(SheetManager.sheets.keys()),
    },
    null,
    3,
  ),
);

export {};
