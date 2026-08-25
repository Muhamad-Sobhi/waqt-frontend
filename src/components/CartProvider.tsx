'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useActiveOffer } from '@/components/OfferProvider';
import { calculateDiscountedPrice } from '@/lib/pricing';

export interface CartItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  originalTotalPrice: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
  originalTotalPrice: 0,
});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { offer } = useActiveOffer();

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('waqt-cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('waqt-cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.productId !== productId));
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.productId === productId ? { ...i, quantity } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  
  // Calculate price with discounts
  let originalTotalPrice = 0;
  let totalPrice = 0;
  
  items.forEach(item => {
    originalTotalPrice += item.price * item.quantity;
    const { finalPrice } = calculateDiscountedPrice(item.price, item.productId, offer);
    totalPrice += finalPrice * item.quantity;
  });

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, originalTotalPrice }}>
      {children}
    </CartContext.Provider>
  );
}
