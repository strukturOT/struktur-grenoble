import { useCallback, useEffect, useRef, useState } from 'react';
import { getPendingCheckout, type PendingCheckout } from '../lib/commerce';

export function usePendingCheckout(checkoutKey: string, userId: string | undefined) {
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const [isChecking, setIsChecking] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [checkedKey, setCheckedKey] = useState('');
  const requestRef = useRef(0);
  const [now, setNow] = useState(Date.now);

  const refreshPendingCheckout = useCallback(async () => {
    const request = ++requestRef.current;
    const identity = `${userId || ''}:${checkoutKey}`;
    setPendingCheckout(null);
    setError(null);
    if (!userId) { setIsChecking(false); setCheckedKey(identity); return null; }
    setIsChecking(true);
    try {
      const pending = await getPendingCheckout(checkoutKey, userId);
      if (request !== requestRef.current) return null;
      setPendingCheckout(pending);
      setCheckedKey(identity);
      setNow(Date.now());
      return pending;
    } catch (caught) {
      if (request === requestRef.current) {
        setCheckedKey(identity);
        setError(caught instanceof Error ? caught.message : 'Impossible de vérifier le paiement.');
      }
      throw caught;
    } finally {
      if (request === requestRef.current) setIsChecking(false);
    }
  }, [checkoutKey, userId]);

  const invalidateRequests = useCallback(() => { ++requestRef.current; }, []);
  useEffect(() => {
    void refreshPendingCheckout().catch(() => {});
    return invalidateRequests;
  }, [invalidateRequests, refreshPendingCheckout]);
  useEffect(() => {
    if (!pendingCheckout || pendingCheckout.expiresAt <= Date.now()) return;
    const timer = window.setTimeout(() => setNow(Date.now()), pendingCheckout.expiresAt - Date.now() + 1);
    return () => window.clearTimeout(timer);
  }, [pendingCheckout]);

  const matches = checkedKey === `${userId || ''}:${checkoutKey}`;
  const current = matches ? pendingCheckout : null;
  const expired = Boolean(current && (!Number.isFinite(current.expiresAt) || current.expiresAt <= now));
  return { pendingCheckout: current, expired, isChecking: Boolean(userId) && (isChecking || !matches), error: matches ? error : null, refreshPendingCheckout };
}
