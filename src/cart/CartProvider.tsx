import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getCartVariantSnapshots } from '../lib/commerce';
import { cartCanCheckout, cartContentsKey, readSavedCart, reconcileCartLines, type CartLine, type CartLineInput } from './cartState';

export type { CartLine } from './cartState';

interface VerifiedCart {
  lines: CartLine[];
  checkoutKey: string;
  pricesChanged: boolean;
}

interface CartContextValue {
  lines: CartLine[];
  checkoutKey: string;
  itemCount: number;
  isRefreshing: boolean;
  refreshError: string | null;
  pricesUpdated: boolean;
  canCheckout: boolean;
  refreshCart: () => Promise<VerifiedCart | null>;
  addLine: (line: CartLineInput) => void;
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
    try { return readSavedCart(window.localStorage.getItem(CART_STORAGE_KEY)); } catch { return []; }
  });
  const [checkoutKey, setCheckoutKey] = useState(() => {
    try { return window.localStorage.getItem(CHECKOUT_STORAGE_KEY) || createCheckoutKey(); } catch { return createCheckoutKey(); }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [pricesUpdated, setPricesUpdated] = useState(false);
  const linesRef = useRef(lines);
  const checkoutKeyRef = useRef(checkoutKey);
  const revisionRef = useRef(0);
  const refreshRequestRef = useRef(0);

  useEffect(() => {
    try { window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines)); } catch { /* The basket remains usable without browser storage. */ }
  }, [lines]);
  useEffect(() => {
    try { window.localStorage.setItem(CHECKOUT_STORAGE_KEY, checkoutKey); } catch { /* In-memory checkout keys still prevent duplicate clicks. */ }
  }, [checkoutKey]);

  const rotateCheckoutKey = useCallback(() => {
    const key = createCheckoutKey();
    checkoutKeyRef.current = key;
    setCheckoutKey(key);
  }, []);

  const refreshCart = useCallback(async (): Promise<VerifiedCart | null> => {
    const requestId = ++refreshRequestRef.current;
    const revision = revisionRef.current;
    const currentLines = linesRef.current;
    if (currentLines.length === 0) {
      setIsRefreshing(false);
      setRefreshError(null);
      return null;
    }
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const snapshots = await getCartVariantSnapshots(currentLines.map((line) => line.variantId));
      if (requestId !== refreshRequestRef.current || revision !== revisionRef.current) return null;
      const updated = reconcileCartLines(linesRef.current, snapshots);
      const pricesChanged = updated.some((line, index) => line.priceCents !== currentLines[index].priceCents || line.currency !== currentLines[index].currency);
      if (pricesChanged) {
        setPricesUpdated(true);
      }
      linesRef.current = updated;
      setLines(updated);
      return cartCanCheckout(updated) ? { lines: updated, checkoutKey: checkoutKeyRef.current, pricesChanged } : null;
    } catch {
      if (requestId === refreshRequestRef.current && revision === revisionRef.current) {
        setRefreshError('Impossible de vérifier les prix et les stocks. Réessayez avant de poursuivre le paiement.');
      }
      return null;
    } finally {
      if (requestId === refreshRequestRef.current) setIsRefreshing(false);
    }
  }, []);

  const contentsKey = cartContentsKey(lines);
  useEffect(() => { void refreshCart(); }, [contentsKey, refreshCart]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void refreshCart(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [refreshCart]);

  const changeCart = useCallback((updater: (current: CartLine[]) => CartLine[]) => {
    ++revisionRef.current;
    const updated = updater(linesRef.current);
    linesRef.current = updated;
    setLines(updated);
    setRefreshError(null);
    rotateCheckoutKey();
  }, [rotateCheckoutKey]);

  const clearCart = useCallback(() => {
    changeCart(() => []);
    setPricesUpdated(false);
  }, [changeCart]);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    checkoutKey,
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    isRefreshing,
    refreshError,
    pricesUpdated,
    canCheckout: !isRefreshing && !refreshError && cartCanCheckout(lines),
    refreshCart,
    addLine(line) {
      changeCart((current) => {
        const existing = current.find((entry) => entry.variantId === line.variantId);
        const refreshed: CartLine = { ...line, quantity: existing ? existing.quantity + 1 : 1, availability: 'checking', stockQuantity: null };
        return existing ? current.map((entry) => entry.variantId === line.variantId ? refreshed : entry) : [...current, refreshed];
      });
    },
    setQuantity(variantId, quantity) {
      if (!Number.isInteger(quantity)) return;
      changeCart((current) => quantity < 1
        ? current.filter((line) => line.variantId !== variantId)
        : current.map((line) => line.variantId === variantId ? { ...line, quantity, availability: 'checking' } : line));
    },
    removeLine(variantId) {
      changeCart((current) => current.filter((line) => line.variantId !== variantId));
    },
    clearCart,
  }), [changeCart, checkoutKey, clearCart, isRefreshing, lines, pricesUpdated, refreshCart, refreshError]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// oxlint-disable-next-line react/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
};
