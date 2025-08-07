import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Product } from '@gymspace/sdk';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CartState {
  items: CartItem[];
  customerName: string;
  notes: string;
  paymentStatus: 'paid' | 'unpaid';
  total: number;
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'SET_CUSTOMER_NAME'; payload: string }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'SET_PAYMENT_STATUS'; payload: 'paid' | 'unpaid' }
  | { type: 'CLEAR_CART' }
  | { type: 'RESET_CART' };

const initialState: CartState = {
  items: [],
  customerName: '',
  notes: '',
  paymentStatus: 'paid',
  total: 0,
};

function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.total, 0);
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1 } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.product.id === product.id);
      
      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = state.items.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + quantity;
            return {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.unitPrice,
            };
          }
          return item;
        });
      } else {
        // Add new item
        const unitPrice = product.price;
        newItems = [
          ...state.items,
          {
            product,
            quantity,
            unitPrice,
            total: quantity * unitPrice,
          },
        ];
      }
      
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
      };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.product.id !== action.payload.productId);
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        const newItems = state.items.filter(item => item.product.id !== productId);
        return {
          ...state,
          items: newItems,
          total: calculateTotal(newItems),
        };
      }
      
      const newItems = state.items.map(item => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity,
            total: quantity * item.unitPrice,
          };
        }
        return item;
      });
      
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
      };
    }
    
    case 'SET_CUSTOMER_NAME':
      return {
        ...state,
        customerName: action.payload,
      };
    
    case 'SET_NOTES':
      return {
        ...state,
        notes: action.payload,
      };
    
    case 'SET_PAYMENT_STATUS':
      return {
        ...state,
        paymentStatus: action.payload,
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        total: 0,
      };
    
    case 'RESET_CART':
      return initialState;
    
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  // Helper functions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCustomerName: (name: string) => void;
  setNotes: (notes: string) => void;
  setPaymentStatus: (status: 'paid' | 'unpaid') => void;
  clearCart: () => void;
  resetCart: () => void;
  getItemQuantity: (productId: string) => number;
  hasItems: boolean;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  const addItem = (product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };
  
  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };
  
  const setCustomerName = (name: string) => {
    dispatch({ type: 'SET_CUSTOMER_NAME', payload: name });
  };
  
  const setNotes = (notes: string) => {
    dispatch({ type: 'SET_NOTES', payload: notes });
  };
  
  const setPaymentStatus = (status: 'paid' | 'unpaid') => {
    dispatch({ type: 'SET_PAYMENT_STATUS', payload: status });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const resetCart = () => {
    dispatch({ type: 'RESET_CART' });
  };
  
  const getItemQuantity = (productId: string): number => {
    const item = state.items.find(item => item.product.id === productId);
    return item?.quantity || 0;
  };
  
  const hasItems = state.items.length > 0;
  const itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
  
  const value: CartContextType = {
    state,
    dispatch,
    addItem,
    removeItem,
    updateQuantity,
    setCustomerName,
    setNotes,
    setPaymentStatus,
    clearCart,
    resetCart,
    getItemQuantity,
    hasItems,
    itemCount,
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}