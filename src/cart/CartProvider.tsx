import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface CartLine {
  variantId: string;
  productId: string;
  name: string;
  brand: string | null;
  variantName: string | null;
  imageUrl: string | null;
  priceCents: number;
  currency: string;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  checkoutKey: string;
  itemCount: number;
  addLine: (line: Omit<CartLine, 'quantity'>) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = 'struktur-cart-v1';
const CHECKOUT_STORAGE_KEY = 'struktur-checkout-key-v1';
const CartContext = createContext<CartContextValue | null>(null);

const createCheckoutKey = () => crypto.randomUUID();

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CartLine[]) : [];
    } catch {
      return [];
    }
  });
  const [checkoutKey, setCheckoutKey] = useState(() => (
    window.localStorage.getItem(CHECKOUT_STORAGE_KEY) || createCheckoutKey()
  ));

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  useEffect(() => {
    window.localStorage.setItem(CHECKOUT_STORAGE_KEY, checkoutKey);
  }, [checkoutKey]);

  const changeCart = (updater: (current: CartLine[]) => CartLine[]) => {
    setLines(updater);
    setCheckoutKey(createCheckoutKey());
  };

  const value = useMemo<CartContextValue>(() => ({
    lines,
    checkoutKey,
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    addLine(line) {
      changeCart((current) => {
        const existing = current.find((entry) => entry.variantId === line.variantId);
        if (!existing) return [...current, { ...line, quantity: 1 }];
        return current.map((entry) => entry.variantId === line.variantId ? { ...entry, quantity: entry.quantity + 1 } : entry);
      });
    },
    setQuantity(variantId, quantity) {
      changeCart((current) => quantity < 1
        ? current.filter((line) => line.variantId !== variantId)
        : current.map((line) => line.variantId === variantId ? { ...line, quantity } : line));
    },
    removeLine(variantId) {
      changeCart((current) => current.filter((line) => line.variantId !== variantId));
    },
    clearCart() {
      setLines([]);
      setCheckoutKey(createCheckoutKey());
    },
  }), [checkoutKey, lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// oxlint-disable-next-line react/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
};
