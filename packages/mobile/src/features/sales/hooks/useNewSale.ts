import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { useCartStore } from '../stores/useCartStore';
import { useSaleUIStore } from '../stores/useSaleUIStore';
import { useNewSaleContext, type SaleDetailsFormData } from '../context/NewSaleProvider';
import type { CreateSaleDto, SaleItemDto, Product, Sale } from '@gymspace/sdk';
import { PRODUCT_TYPES } from '@/shared/constants';

export const useNewSale = () => {
  // Get form methods
  const { getValues, reset: resetForm, setValue, watch } = useFormContext<SaleDetailsFormData>();
  
  // Get context data
  const context = useNewSaleContext();
  
  // Get all store states and actions separately
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const isInCart = useCartStore((state) => state.isInCart);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  
  const isProcessing = useSaleUIStore((state) => state.isProcessing);
  const error = useSaleUIStore((state) => state.error);
  const selectedTab = useSaleUIStore((state) => state.selectedTab);
  const setSelectedTab = useSaleUIStore((state) => state.setSelectedTab);
  const setProcessing = useSaleUIStore((state) => state.setProcessing);
  const setError = useSaleUIStore((state) => state.setError);
  const resetUI = useSaleUIStore((state) => state.reset);
  const lastSelectedProductId = useSaleUIStore((state) => state.lastSelectedProductId);
  const setLastSelectedProduct = useSaleUIStore((state) => state.setLastSelectedProduct);
  
  // Composite action: Toggle item in cart
  const addItemToCart = useCallback((product: Product) => {
    // Only check stock for products, not services
    if (product.type === PRODUCT_TYPES.PRODUCT && product.stock !== null && product.stock <= 0) {
      Alert.alert('Sin stock', 'Este producto no tiene stock disponible.');
      return false;
    }
    
    // Check if item is already in cart
    const existingQuantity = getItemQuantity(product.id);
    
    if (existingQuantity === 0) {
      // Not in cart, add it
      addItem(product, 1);
      setLastSelectedProduct(product.id);
    } else if (existingQuantity === 1) {
      // In cart with quantity 1, remove it
      removeItem(product.id);
      setLastSelectedProduct(null);
    } else {
      // In cart with quantity > 1, just set as selected for controls
      setLastSelectedProduct(product.id);
    }
    
    return true;
  }, [addItem, removeItem, getItemQuantity, setLastSelectedProduct]);
  
  // Composite action: Reset entire sale
  const resetSale = useCallback(() => {
    clearCart();
    resetForm();
    resetUI();
  }, [clearCart, resetForm, resetUI]);
  
  // Composite action: Complete sale
  const completeSale = useCallback(async (): Promise<Sale> => {
    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega items al carrito antes de completar la venta.');
      throw new Error('Cart is empty');
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      // Get form values
      const formValues = getValues();
      
      // Build sale data
      const saleItems: SaleItemDto[] = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
      
      const saleData: CreateSaleDto = {
        items: saleItems,
        customerId: formValues.client?.id,
        customerName: formValues.customerName || undefined,
        notes: formValues.notes || undefined,
        paymentStatus: formValues.paymentStatus,
        paymentMethodId: formValues.paymentMethodId || undefined,
        fileIds: formValues.fileIds.filter((id): id is string => Boolean(id)),
      };
      
      // Execute sale
      const result = await context.createSaleMutation.mutateAsync(saleData);
      
      // Reset everything on success
      resetSale();
      
      return result;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [items, getValues, setProcessing, setError, context.createSaleMutation, resetSale]);
  
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
          onPress: () => removeItem(productId) 
        },
      ]
    );
  }, [removeItem]);
  
  // Compute values once per render
  const total = useMemo(() => items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const hasItemsValue = useMemo(() => items.length > 0, [items]);
  
  return {
    // Cart state and actions
    items,
    addItem: addItemToCart,
    removeItem: removeItemWithConfirmation,
    updateQuantity,
    clearCart,
    hasItems: hasItemsValue,
    total,
    itemCount,
    isInCart,
    getItemQuantity,
    
    // Form methods for sale details
    formMethods: { getValues, setValue, watch, reset: resetForm },
    
    // UI state and actions
    isProcessing,
    error,
    selectedTab,
    setSelectedTab,
    
    // Products and services data
    products: context.products,
    services: context.services,
    loadingProducts: context.loadingProducts,
    loadingServices: context.loadingServices,
    
    // Last selected product
    lastSelectedProductId,
    setLastSelectedProduct,
    
    // Composite actions
    completeSale,
    resetSale,
  };
};