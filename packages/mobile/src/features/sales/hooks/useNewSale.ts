import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useCartStore } from '../stores/useCartStore';
import { useSaleDetailsStore } from '../stores/useSaleDetailsStore';
import { useSaleUIStore } from '../stores/useSaleUIStore';
import { useNewSaleContext } from '../context/NewSaleProvider';
import type { CreateSaleDto, SaleItemDto, Product } from '@gymspace/sdk';
import { PRODUCT_TYPES } from '@/shared/constants';

export const useNewSale = () => {
  // Get all store states and actions
  const cartStore = useCartStore();
  const saleDetailsStore = useSaleDetailsStore();
  const uiStore = useSaleUIStore();
  
  // Get context data
  const context = useNewSaleContext();
  
  // Composite action: Add item with stock validation
  const addItemToCart = useCallback((product: Product) => {
    // Only check stock for products, not services
    if (product.type === PRODUCT_TYPES.PRODUCT && product.stock !== null && product.stock <= 0) {
      Alert.alert('Sin stock', 'Este producto no tiene stock disponible.');
      return false;
    }
    
    cartStore.addItem(product, 1);
    uiStore.closeItemSelection();
    return true;
  }, [cartStore, uiStore]);
  
  // Composite action: Complete sale
  const completeSale = useCallback(async (): Promise<void> => {
    if (!cartStore.hasItems()) {
      Alert.alert('Carrito vacío', 'Agrega items al carrito antes de completar la venta.');
      throw new Error('Cart is empty');
    }
    
    uiStore.setProcessing(true);
    uiStore.setError(null);
    
    try {
      // Build sale data
      const saleItems: SaleItemDto[] = cartStore.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
      
      const saleData: CreateSaleDto = {
        items: saleItems,
        customerId: saleDetailsStore.details.client?.id,
        customerName: saleDetailsStore.details.customerName || undefined,
        notes: saleDetailsStore.details.notes || undefined,
        paymentStatus: saleDetailsStore.details.paymentStatus,
        paymentMethodId: saleDetailsStore.details.paymentMethodId || undefined,
        fileIds: saleDetailsStore.details.fileIds.filter(id => id),
      };
      
      // Execute sale
      const result = await context.createSaleMutation.mutateAsync(saleData);
      
      // Reset everything on success
      resetSale();
      
      return result;
    } catch (error) {
      uiStore.setError(error as Error);
      throw error;
    } finally {
      uiStore.setProcessing(false);
    }
  }, [cartStore, saleDetailsStore.details, uiStore, context.createSaleMutation]);
  
  // Composite action: Reset entire sale
  const resetSale = useCallback(() => {
    cartStore.clearCart();
    saleDetailsStore.reset();
    uiStore.reset();
  }, [cartStore, saleDetailsStore, uiStore]);
  
  // Composite action: Remove item with confirmation
  const removeItemWithConfirmation = useCallback((productId: string) => {
    Alert.alert(
      'Remover item',
      '¿Estás seguro de que quieres remover este item del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive', 
          onPress: () => cartStore.removeItem(productId) 
        },
      ]
    );
  }, [cartStore]);
  
  return {
    // Cart state and actions
    items: cartStore.items,
    addItem: addItemToCart,
    removeItem: removeItemWithConfirmation,
    updateQuantity: cartStore.updateQuantity,
    clearCart: cartStore.clearCart,
    total: cartStore.getTotal(),
    itemCount: cartStore.getItemCount(),
    hasItems: cartStore.hasItems(),
    
    // Sale details state and actions
    saleDetails: saleDetailsStore.details,
    setSaleDetails: saleDetailsStore.setSaleDetails,
    setClient: saleDetailsStore.setClient,
    
    // UI state and actions
    isProcessing: uiStore.isProcessing,
    error: uiStore.error,
    showItemSelection: uiStore.showItemSelection,
    selectedTab: uiStore.selectedTab,
    setShowItemSelection: uiStore.setShowItemSelection,
    setSelectedTab: uiStore.setSelectedTab,
    openItemSelection: uiStore.openItemSelection,
    closeItemSelection: uiStore.closeItemSelection,
    
    // Products and services data
    products: context.products,
    services: context.services,
    loadingProducts: context.loadingProducts,
    loadingServices: context.loadingServices,
    
    // Composite actions
    completeSale,
    resetSale,
  };
};