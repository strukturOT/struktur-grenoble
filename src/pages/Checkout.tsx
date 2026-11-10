import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LoaderCircle, LockKeyhole, ShoppingBag } from 'lucide-react';
import { useCart } from '../cart/CartProvider';
import { cartLineProblem } from '../cart/cartState';
import { usePendingCheckout } from '../cart/usePendingCheckout';
import { useShippingSettings } from '../hooks/useShippingSettings';
import { useAuth } from '../auth/AuthProvider';
import { formatMoney, getCheckoutOrderBySession, isStripeCheckoutUrl, startStripeCheckout, type StoreOrder } from '../lib/commerce';

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const Checkout = () => {
  const { lines, checkoutKey, clearCart, refreshCart, isRefreshing, refreshError, pricesUpdated, canCheckout } = useCart();
  const { user, isLoading } = useAuth();
  const { pendingCheckout, expired, isChecking, error: pendingError, refreshPendingCheckout } = usePendingCheckout(checkoutKey, user?.id);
  const canResume = Boolean(pendingCheckout?.url && !expired && !isChecking);
  const { settings: shipping, isLoading: shippingLoading, error: shippingError, refreshShippingSettings } = useShippingSettings();
  const shippingReady = Boolean(shipping && !shippingLoading && !shippingError);
  const quote = canResume ? pendingCheckout : null;
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const returnedFromStripe = searchParams.get('success') === 'true' && Boolean(sessionId);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<StoreOrder | null>(null);
  const [confirmationFinished, setConfirmationFinished] = useState(false);
  const total = useMemo(() => lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0), [lines]);

  useEffect(() => {
    if (!returnedFromStripe && !isLoading && user) void refreshCart();
  }, [isLoading, refreshCart, returnedFromStripe, user]);

  useEffect(() => {
    if (!returnedFromStripe || !sessionId || !user || confirmedOrder) return;
    let cancelled = false;

    const confirm = async () => {
      for (let attempt = 0; attempt < 8 && !cancelled; attempt += 1) {
        const { data } = await getCheckoutOrderBySession(sessionId);
        if (data?.paymentStatus === 'paid') {
          setConfirmedOrder(data);
          clearCart();
          setConfirmationFinished(true);
          return;
        }
        await wait(1250);
      }
      if (!cancelled) setConfirmationFinished(true);
    };

    void confirm();
    return () => { cancelled = true; };
  }, [clearCart, confirmedOrder, returnedFromStripe, sessionId, user]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><LoaderCircle className="animate-spin text-struktur-orange" /></div>;
  }
  if (!user) return <Navigate to="/compte?next=/checkout" replace />;

  if (returnedFromStripe) {
    if (!confirmationFinished) {
      return <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 pb-24 pt-32 text-center"><LoaderCircle size={32} className="animate-spin text-struktur-orange" /><h1 className="mt-6 font-display text-4xl">Confirmation du paiement…</h1><p className="mt-3 text-theme-ink/60">Stripe nous transmet votre confirmation sécurisée.</p></div>;
    }
    if (confirmedOrder) {
      return <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 pb-24 pt-32 text-center"><CheckCircle2 size={36} strokeWidth={1.4} className="text-struktur-orange" /><p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-struktur-orange">Paiement confirmé</p><h1 className="mt-4 font-display text-5xl">Merci pour votre commande.</h1><p className="mt-5 text-theme-ink/65">Commande n°{confirmedOrder.orderNumber} · {formatMoney(confirmedOrder.totalCents, confirmedOrder.currency)}</p><Link to="/compte" className="mt-8 bg-struktur-orange px-7 py-4 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#ff5511]">Voir mes commandes</Link></div>;
    }
    return <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 pb-24 pt-32 text-center"><LockKeyhole size={32} strokeWidth={1.4} className="text-struktur-orange" /><h1 className="mt-6 font-display text-4xl">Confirmation en cours.</h1><p className="mt-4 max-w-lg text-theme-ink/60">Le paiement est encore en cours de validation. Ne payez pas une seconde fois : votre commande apparaîtra automatiquement dans votre espace client.</p><Link to="/compte" className="mt-8 border-b border-struktur-orange pb-1 text-xs uppercase tracking-[0.18em] text-struktur-orange">Voir mes commandes</Link></div>;
  }

  if (lines.length === 0) {
    return <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-32 text-center"><ShoppingBag size={32} strokeWidth={1.4} className="mb-5 text-theme-ink/35" /><h1 className="font-display text-4xl">Votre panier est vide.</h1><Link to="/boutique" className="mt-8 border-b border-struktur-orange pb-1 text-xs uppercase tracking-[0.18em] text-struktur-orange">Voir la boutique</Link></div>;
  }

  const pay = async () => {
    setError(null);
    setIsRedirecting(true);
    try {
      const pending = await refreshPendingCheckout();
      if (pending && Number.isFinite(pending.expiresAt) && pending.expiresAt > Date.now()) {
        if (!pending.url || !isStripeCheckoutUrl(pending.url)) throw new Error('Votre paiement est encore en préparation. Réessayez dans quelques instants.');
        if (!quote || quote.orderId !== pending.orderId || quote.totalCents !== pending.totalCents || quote.subtotalCents !== pending.subtotalCents || quote.shippingCents !== pending.shippingCents || quote.currency !== pending.currency) {
          setError('Votre tentative de paiement a été actualisée. Vérifiez le montant réservé, puis cliquez de nouveau pour reprendre.');
          setIsRedirecting(false);
          return;
        }
        window.location.assign(pending.url);
        return;
      }
      if (quote) {
        setError('Cette tentative de paiement n’est plus disponible. Vérifiez vos commandes et le nouveau total avant de recommencer.');
        setIsRedirecting(false);
        return;
      }
      const verified = await refreshCart();
      if (!verified) {
        setError('Le panier doit être vérifié. Corrigez les articles signalés ou réessayez l’actualisation.');
        setIsRedirecting(false);
        return;
      }
      if (verified.pricesChanged) {
        setError('Les prix ont changé. Vérifiez le nouveau total TTC, puis cliquez à nouveau pour payer.');
        setIsRedirecting(false);
        return;
      }
      const currentShipping = await refreshShippingSettings();
      if (!currentShipping) throw new Error('Impossible de vérifier les frais de livraison. Réessayez avant le paiement.');
      if (currentShipping.amount_cents !== shipping?.amount_cents) throw new Error('Les frais de livraison ont changé. Vérifiez le nouveau total TTC, puis cliquez à nouveau pour payer.');
      const { url } = await startStripeCheckout(
        verified.lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        verified.checkoutKey,
        currentShipping.amount_cents,
      );
      if (!isStripeCheckoutUrl(url)) throw new Error('Cette page de paiement est indisponible. Réessayez.');
      window.location.assign(url);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Impossible de démarrer le paiement.');
      setIsRedirecting(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 pb-24 pt-32 md:px-12 md:pt-44">
      <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-struktur-orange">Paiement sécurisé</p>
          <h1 className="mt-4 font-display text-5xl md:text-7xl">Finaliser la commande</h1>
          {pricesUpdated && !canResume && <p role="status" className="mt-6 border border-struktur-orange/30 bg-struktur-orange/5 p-4 text-sm text-theme-ink/70">Les prix ont été actualisés. Vérifiez le nouveau total TTC avant de payer.</p>}
          <div className="mt-10 border-y border-theme-ink/10">
            {lines.map((line) => {
              const problem = canResume ? null : cartLineProblem(line);
              return <div key={line.variantId} className="flex items-center gap-4 border-b border-theme-ink/10 py-5 last:border-0"><div className="h-20 w-16 shrink-0 overflow-hidden bg-theme-surface">{line.imageUrl && <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="font-display text-lg">{line.name}</p><p className="text-xs text-theme-ink/50">{line.variantName || 'Taille unique'} · Qté {line.quantity}</p>{problem && <p className="mt-2 text-xs leading-relaxed text-red-600">{problem}</p>}</div><p className="text-right text-sm">{!isRefreshing && !refreshError && line.availability === 'available' && line.priceCents > 0 ? formatMoney(line.priceCents * line.quantity, line.currency) : 'Prix à vérifier'}</p></div>;
            })}
          </div>
        </div>
        <aside className="h-fit border border-theme-ink/10 bg-theme-surface p-6 lg:sticky lg:top-32">
          <div className="flex items-center gap-3"><LockKeyhole size={18} className="text-struktur-orange" /><h2 className="font-display text-2xl">Votre total</h2></div>
          {quote && <div className="mt-5 border border-struktur-orange/30 bg-struktur-orange/5 p-4 text-xs leading-relaxed text-theme-ink/70"><p>Ces articles sont déjà réservés et conservent leur tarif de livraison.</p>{(quote.subtotalCents !== total || (shipping && quote.shippingCents !== shipping.amount_cents)) && <p className="mt-2">Les articles affichent les prix actuels. Reprendre le paiement conserve les montants réservés ci-dessous.</p>}</div>}
          {expired && <p role="status" className="mt-5 text-xs leading-relaxed text-theme-ink/65">Cette tentative a expiré. Actualisez le panier pour vérifier les stocks libérés avant de recommencer.</p>}
          <div className="mt-7 space-y-4 border-b border-theme-ink/10 pb-4 text-sm">
            <div className="flex justify-between gap-3"><span className="text-theme-ink/60">{quote ? 'Sous-total réservé TTC' : 'Sous-total TTC'}</span><span>{quote ? formatMoney(quote.subtotalCents, quote.currency) : isRefreshing ? 'Vérification…' : canCheckout ? formatMoney(total, lines[0]?.currency || 'EUR') : 'À vérifier'}</span></div>
            <div className="flex items-start justify-between gap-3"><span className="text-theme-ink/60">{quote ? 'Livraison réservée' : shipping?.label || 'Livraison'}<span className="mt-1 block text-[10px]">France uniquement</span></span><span className="shrink-0">{quote ? quote.shippingCents === 0 ? 'Offerte' : formatMoney(quote.shippingCents, quote.currency) : shippingLoading ? 'Calcul…' : shipping ? shipping.amount_cents === 0 ? 'Offerte' : formatMoney(shipping.amount_cents) : 'À vérifier'}</span></div>
            <div className="flex justify-between gap-3 border-t border-theme-ink/10 pt-4 font-medium"><span>Total TTC</span><span>{quote ? formatMoney(quote.totalCents, quote.currency) : canCheckout && shippingReady && shipping ? formatMoney(total + shipping.amount_cents, lines[0]?.currency || 'EUR') : 'À vérifier'}</span></div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-theme-ink/50">Le total inclut la TVA et les frais de livraison indiqués. Paiement chiffré et traité par Stripe.</p>
          {(error || refreshError || pendingError || (!canResume && shippingError)) && <p role="alert" className="mt-5 border border-red-500/30 bg-red-500/5 p-3 text-xs leading-relaxed text-red-600">{pendingError || refreshError || error || shippingError}</p>}
          {(!canCheckout || pendingError || (!canResume && !shippingReady)) && !isRefreshing && <button type="button" onClick={() => { void refreshCart(); void refreshPendingCheckout().catch(() => {}); void refreshShippingSettings(); }} className="mt-5 border-b border-theme-ink/30 pb-1 text-xs text-theme-ink/65 hover:text-struktur-orange">Réessayer la vérification du panier</button>}
          <button type="button" onClick={() => void pay()} disabled={isRedirecting || isChecking || Boolean(pendingError) || (!canResume && (!canCheckout || !shippingReady))} className="mt-6 flex w-full items-center justify-center gap-3 bg-struktur-orange py-4 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#ff5511] disabled:cursor-not-allowed disabled:opacity-50">{(isRedirecting || isRefreshing || isChecking || (!canResume && shippingLoading)) && <LoaderCircle size={15} className="animate-spin" />}{isRedirecting ? 'Ouverture de Stripe…' : isChecking ? 'Vérification du paiement…' : canResume ? 'Reprendre le paiement' : isRefreshing || shippingLoading ? 'Vérification du panier…' : 'Payer avec Stripe'}</button>
          <Link to="/panier" className="mt-5 block text-center text-[10px] uppercase tracking-[0.16em] text-theme-ink/45 hover:text-theme-ink">Retour au panier</Link>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
