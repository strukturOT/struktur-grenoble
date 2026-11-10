import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../cart/CartProvider';
import { cartLineProblem } from '../cart/cartState';
import { usePendingCheckout } from '../cart/usePendingCheckout';
import { useShippingSettings } from '../hooks/useShippingSettings';
import { useAuth } from '../auth/AuthProvider';
import { formatMoney } from '../lib/commerce';

const Panier = () => {
  const { lines, checkoutKey, itemCount, setQuantity, removeLine, refreshCart, isRefreshing, refreshError, pricesUpdated, canCheckout } = useCart();
  const { user, isConfigured } = useAuth();
  const { pendingCheckout, expired, isChecking, error: pendingError, refreshPendingCheckout } = usePendingCheckout(checkoutKey, user?.id);
  const canResume = Boolean(pendingCheckout?.url && !expired && !isChecking);
  const { settings: shipping, isLoading: shippingLoading, error: shippingError, refreshShippingSettings } = useShippingSettings();
  const shippingReady = Boolean(shipping && !shippingLoading && !shippingError);
  const quote = canResume ? pendingCheckout : null;
  const total = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  const currency = lines[0]?.currency ?? 'EUR';

  useEffect(() => { void refreshCart(); }, [refreshCart]);

  if (lines.length === 0) {
    return <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-32 text-center"><ShoppingBag size={32} strokeWidth={1.4} className="mb-5 text-theme-ink/35" /><h1 className="font-display text-4xl">Votre panier est vide.</h1><p className="mt-3 max-w-md font-light text-theme-ink/60">Découvrez les pièces disponibles dans la boutique.</p><Link to="/boutique" className="mt-8 border-b border-struktur-orange pb-1 text-xs font-medium uppercase tracking-[0.2em] text-struktur-orange transition-colors hover:border-theme-ink hover:text-theme-ink">Voir la boutique</Link></div>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 pb-24 pt-32 md:px-12 md:pb-32 md:pt-44">
      <div className="mb-12 flex items-end justify-between border-b border-theme-ink/10 pb-6"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-struktur-orange">Votre sélection</p><h1 className="text-5xl font-display md:text-7xl">Panier</h1></div><p className="text-xs uppercase tracking-[0.18em] text-theme-ink/45">{itemCount} article{itemCount > 1 ? 's' : ''}</p></div>
      {pricesUpdated && !canResume && <p role="status" className="mb-6 border border-struktur-orange/30 bg-struktur-orange/5 p-4 text-sm text-theme-ink/70">Les prix ont été actualisés. Vérifiez le nouveau total TTC avant de continuer.</p>}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-8">{lines.map((line) => {
          const problem = canResume ? null : cartLineProblem(line);
          const verified = !isRefreshing && !refreshError && line.availability === 'available';
          return <article key={line.variantId} className="flex gap-4 border-b border-theme-ink/10 py-6 first:pt-0 sm:gap-6">
            <div className="h-32 w-24 shrink-0 overflow-hidden bg-theme-surface sm:h-40 sm:w-32">{line.imageUrl && <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />}</div>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>{line.brand && <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-struktur-orange">{line.brand}</p>}<h2 className="mt-1 text-xl font-display sm:text-2xl">{line.name}</h2>{line.variantName && <p className="mt-1 text-sm text-theme-ink/55">{line.variantName}</p>}</div>
                <p className="text-sm">{verified && line.priceCents > 0 ? formatMoney(line.priceCents * line.quantity, line.currency) : 'Prix à vérifier'}</p>
              </div>
              {problem && <p role="status" className={`mt-3 text-xs leading-relaxed ${line.availability === 'checking' ? 'text-theme-ink/55' : 'text-red-600'}`}>{problem}</p>}
              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center border border-theme-ink/15">
                  <button type="button" onClick={() => setQuantity(line.variantId, line.quantity - 1)} className="p-2.5 transition-colors hover:text-struktur-orange" aria-label={`Diminuer la quantité de ${line.name}`}><Minus size={14} /></button>
                  <span className="w-8 text-center text-xs">{line.quantity}</span>
                  <button type="button" onClick={() => setQuantity(line.variantId, line.quantity + 1)} disabled={!verified || line.quantity >= Math.min(line.stockQuantity ?? 0, 10)} className="p-2.5 transition-colors hover:text-struktur-orange disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Augmenter la quantité de ${line.name}`}><Plus size={14} /></button>
                </div>
                <button type="button" onClick={() => removeLine(line.variantId)} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-theme-ink/45 transition-colors hover:text-struktur-orange"><Trash2 size={13} />Retirer</button>
              </div>
            </div>
          </article>;
        })}</div>
        <aside className="h-fit border border-theme-ink/10 bg-theme-surface p-6 lg:col-span-4 lg:sticky lg:top-32">
          <h2 className="text-2xl font-display">Récapitulatif</h2>
          {quote && <div className="mt-5 border border-struktur-orange/30 bg-struktur-orange/5 p-4 text-xs leading-relaxed text-theme-ink/70"><p>Votre tentative de paiement réserve déjà ces articles et conserve son tarif de livraison.</p>{(quote.subtotalCents !== total || (shipping && quote.shippingCents !== shipping.amount_cents)) && <p className="mt-2">Les articles affichent les prix actuels. Reprendre le paiement conserve les montants réservés ci-dessous.</p>}</div>}
          {expired && <p role="status" className="mt-5 text-xs leading-relaxed text-theme-ink/65">Votre tentative de paiement a expiré. Les stocks sont libérés automatiquement ; actualisez le panier avant de recommencer.</p>}
          <div className="mt-8 space-y-4 border-b border-theme-ink/10 pb-4 text-sm">
            <div className="flex items-center justify-between gap-3"><span className="text-theme-ink/60">{quote ? 'Sous-total réservé TTC' : 'Sous-total TTC'}</span><span>{quote ? formatMoney(quote.subtotalCents, quote.currency) : isRefreshing ? 'Vérification…' : canCheckout ? formatMoney(total, currency) : 'À vérifier'}</span></div>
            <div className="flex items-start justify-between gap-3"><span className="text-theme-ink/60">{quote ? 'Livraison réservée' : shipping?.label || 'Livraison'}<span className="mt-1 block text-[10px]">France uniquement</span></span><span className="shrink-0">{quote ? quote.shippingCents === 0 ? 'Offerte' : formatMoney(quote.shippingCents, quote.currency) : shippingLoading ? 'Calcul…' : shipping ? shipping.amount_cents === 0 ? 'Offerte' : formatMoney(shipping.amount_cents) : 'À vérifier'}</span></div>
            <div className="flex items-center justify-between gap-3 border-t border-theme-ink/10 pt-4 font-medium"><span>Total TTC</span><span>{quote ? formatMoney(quote.totalCents, quote.currency) : canCheckout && shippingReady && shipping ? formatMoney(total + shipping.amount_cents, currency) : 'À vérifier'}</span></div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-theme-ink/50">Les prix incluent la TVA. Le tarif de livraison indiqué s’applique à cette commande.</p>
          {(refreshError || pendingError || (!canResume && shippingError)) && <p role="alert" className="mt-5 text-xs leading-relaxed text-red-600">{refreshError || pendingError || shippingError}</p>}
          {!canCheckout && !canResume && !isRefreshing && !refreshError && <p className="mt-5 text-xs leading-relaxed text-theme-ink/65">Vérifiez les articles signalés dans votre panier pour continuer.</p>}
          <button type="button" onClick={() => { void refreshCart(); void refreshPendingCheckout().catch(() => {}); void refreshShippingSettings(); }} disabled={isRefreshing || isChecking || shippingLoading} className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-theme-ink/60 hover:text-struktur-orange disabled:opacity-50"><RefreshCw size={13} className={isRefreshing || shippingLoading ? 'animate-spin' : ''} />{isRefreshing || isChecking || shippingLoading ? 'Actualisation…' : 'Actualiser le panier'}</button>
          {!user && <p className="mt-6 border border-struktur-orange/30 bg-struktur-orange/5 p-4 text-xs leading-relaxed text-theme-ink/70">Connectez-vous avant le paiement pour retrouver vos commandes dans votre espace client.</p>}
          {isConfigured && canResume
            ? <Link to="/checkout" className="mt-6 block w-full bg-struktur-orange py-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#ff5511]">Reprendre le paiement</Link>
            : isConfigured && canCheckout && !isChecking && !pendingError && shippingReady
            ? <Link to={user ? '/checkout' : '/compte?next=/panier'} className="mt-6 block w-full bg-struktur-orange py-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#ff5511]">{user ? 'Passer au paiement' : 'Se connecter pour payer'}</Link>
            : <button type="button" disabled className="mt-6 block w-full cursor-not-allowed bg-theme-ink/10 py-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-theme-ink/35">{isRefreshing ? 'Vérification du panier…' : 'Paiement indisponible'}</button>}
          {!isConfigured && <p className="mt-3 text-center text-[10px] uppercase tracking-[0.14em] text-theme-ink/40">Paiement disponible après configuration</p>}
        </aside>
      </div>
    </div>
  );
};

export default Panier;
