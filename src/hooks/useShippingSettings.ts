import { useCallback, useEffect, useRef, useState } from 'react';
import { getShippingSettings, type ShippingSettings } from '../lib/commerce';

export function useShippingSettings({ refreshKey = 0, refreshOnFocus = true }: { refreshKey?: number; refreshOnFocus?: boolean } = {}) {
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const refreshShippingSettings = useCallback(async () => {
    const request = ++requestRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const current = await getShippingSettings();
      if (request !== requestRef.current) return null;
      setSettings(current);
      return current;
    } catch {
      if (request === requestRef.current) {
        setSettings(null);
        setError('Impossible de vérifier les frais de livraison. Réessayez avant le paiement.');
      }
      return null;
    } finally {
      if (request === requestRef.current) setIsLoading(false);
    }
  }, []);
  const invalidateRequests = useCallback(() => { ++requestRef.current; }, []);
  useEffect(() => { void refreshShippingSettings(); return invalidateRequests; }, [invalidateRequests, refreshKey, refreshShippingSettings]);
  useEffect(() => {
    if (!refreshOnFocus) return;
    const refresh = () => { if (document.visibilityState === 'visible') void refreshShippingSettings(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refreshOnFocus, refreshShippingSettings]);

  return { settings, isLoading, error, refreshShippingSettings };
}
