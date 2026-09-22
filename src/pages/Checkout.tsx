import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LoaderCircle, LockKeyhole, ShoppingBag } from 'lucide-react';
import { useCart } from '../cart/CartProvider';
import { useAuth } from '../auth/AuthProvider';
import { formatMoney, getCheckoutOrderBySession, startStripeCheckout, type StoreOrder } from '../lib/commerce';

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const Checkout = () => {
  const { lines, checkoutKey, clearCart } = useCart();
  const { user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const returnedFromStripe = searchParams.get('success') === 'true' && Boolean(sessionId);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<StoreOrder | null>(null);
  const [confirmationFinished, setConfirmationFinished] = useState(false);
  const total = useMemo(() => lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0), [lines]);

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
      const { url } = await startStripeCheckout(
        lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        checkoutKey,
      );
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
          <div className="mt-10 border-y border-theme-ink/10">
            {lines.map((line) => <div key={line.variantId} className="flex items-center gap-4 border-b border-theme-ink/10 py-5 last:border-0"><div className="h-20 w-16 shrink-0 overflow-hidden bg-theme-surface">{line.imageUrl && <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="font-display text-lg">{line.name}</p><p className="text-xs text-theme-ink/50">{line.variantName || 'Taille unique'} · Qté {line.quantity}</p></div><p className="text-sm">{formatMoney(line.priceCents * line.quantity, line.currency)}</p></div>)}
          </div>
        </div>
        <aside className="h-fit border border-theme-ink/10 bg-theme-surface p-6 lg:sticky lg:top-32">
          <div className="flex items-center gap-3"><LockKeyhole size={18} className="text-struktur-orange" /><h2 className="font-display text-2xl">Votre total</h2></div>
          <div className="mt-7 flex justify-between border-b border-theme-ink/10 pb-4 text-sm"><span className="text-theme-ink/60">Sous-total</span><span>{formatMoney(total, lines[0]?.currency || 'EUR')}</span></div>
          <p className="mt-4 text-xs leading-relaxed text-theme-ink/50">Les frais de livraison sont affichés avant validation sur la page Stripe. Paiement chiffré et traité par Stripe.</p>
          {error && <p role="alert" className="mt-5 border border-red-500/30 bg-red-500/5 p-3 text-xs leading-relaxed text-red-600">{error}</p>}
          <button type="button" onClick={() => void pay()} disabled={isRedirecting} className="mt-6 flex w-full items-center justify-center gap-3 bg-struktur-orange py-4 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#ff5511] disabled:cursor-wait disabled:opacity-65">{isRedirecting && <LoaderCircle size={15} className="animate-spin" />}{isRedirecting ? 'Ouverture de Stripe…' : 'Payer avec Stripe'}</button>
          <Link to="/panier" className="mt-5 block text-center text-[10px] uppercase tracking-[0.16em] text-theme-ink/45 hover:text-theme-ink">Retour au panier</Link>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
