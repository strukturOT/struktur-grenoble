import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../cart/CartProvider';
import { useAuth } from '../auth/AuthProvider';
import { formatMoney } from '../lib/commerce';

const Panier = () => {
  const { lines, itemCount, setQuantity, removeLine } = useCart();
  const { user, isConfigured } = useAuth();
  const total = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  const currency = lines[0]?.currency ?? 'EUR';

  if (lines.length === 0) {
    return <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-32 text-center"><ShoppingBag size={32} strokeWidth={1.4} className="mb-5 text-theme-ink/35" /><h1 className="font-display text-4xl">Votre panier est vide.</h1><p className="mt-3 max-w-md font-light text-theme-ink/60">Découvrez les pièces disponibles dans la boutique.</p><Link to="/boutique" className="mt-8 border-b border-struktur-orange pb-1 text-xs font-medium uppercase tracking-[0.2em] text-struktur-orange transition-colors hover:border-theme-ink hover:text-theme-ink">Voir la boutique</Link></div>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 pb-24 pt-32 md:px-12 md:pb-32 md:pt-44">
      <div className="mb-12 flex items-end justify-between border-b border-theme-ink/10 pb-6"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-struktur-orange">Votre sélection</p><h1 className="text-5xl font-display md:text-7xl">Panier</h1></div><p className="text-xs uppercase tracking-[0.18em] text-theme-ink/45">{itemCount} article{itemCount > 1 ? 's' : ''}</p></div>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20"><div className="lg:col-span-8">{lines.map((line) => <article key={line.variantId} className="flex gap-4 border-b border-theme-ink/10 py-6 first:pt-0 sm:gap-6"><div className="h-32 w-24 shrink-0 overflow-hidden bg-theme-surface sm:h-40 sm:w-32">{line.imageUrl && <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />}</div><div className="flex min-w-0 flex-1 flex-col justify-between"><div className="flex items-start justify-between gap-4"><div>{line.brand && <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-struktur-orange">{line.brand}</p>}<h2 className="mt-1 text-xl font-display sm:text-2xl">{line.name}</h2>{line.variantName && <p className="mt-1 text-sm text-theme-ink/55">{line.variantName}</p>}</div><p className="shrink-0 text-sm">{formatMoney(line.priceCents * line.quantity, line.currency)}</p></div><div className="mt-5 flex items-center justify-between"><div className="flex items-center border border-theme-ink/15"><button type="button" onClick={() => setQuantity(line.variantId, line.quantity - 1)} className="p-2.5 transition-colors hover:text-struktur-orange" aria-label="Diminuer la quantité"><Minus size={14} /></button><span className="w-8 text-center text-xs">{line.quantity}</span><button type="button" onClick={() => setQuantity(line.variantId, line.quantity + 1)} className="p-2.5 transition-colors hover:text-struktur-orange" aria-label="Augmenter la quantité"><Plus size={14} /></button></div><button type="button" onClick={() => removeLine(line.variantId)} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-theme-ink/45 transition-colors hover:text-struktur-orange"><Trash2 size={13} />Retirer</button></div></div></article>)}</div>
        <aside className="h-fit border border-theme-ink/10 bg-theme-surface p-6 lg:col-span-4 lg:sticky lg:top-32"><h2 className="text-2xl font-display">Récapitulatif</h2><div className="mt-8 flex items-center justify-between border-b border-theme-ink/10 pb-4 text-sm"><span className="text-theme-ink/60">Sous-total</span><span>{formatMoney(total, currency)}</span></div><p className="mt-4 text-xs leading-relaxed text-theme-ink/50">Les frais de livraison et les éventuelles taxes seront calculés au paiement.</p>{!user && <p className="mt-6 border border-struktur-orange/30 bg-struktur-orange/5 p-4 text-xs leading-relaxed text-theme-ink/70">Connectez-vous avant le paiement pour retrouver vos commandes dans votre espace client.</p>}<Link to={user ? '/checkout' : '/compte?next=/panier'} className={`mt-6 block w-full py-4 text-center text-xs font-medium uppercase tracking-[0.2em] ${isConfigured ? 'bg-struktur-orange text-white transition-colors hover:bg-[#ff5511]' : 'pointer-events-none bg-theme-ink/10 text-theme-ink/35'}`}>{user ? 'Passer au paiement' : 'Se connecter pour payer'}</Link>{!isConfigured && <p className="mt-3 text-center text-[10px] uppercase tracking-[0.14em] text-theme-ink/40">Paiement disponible après configuration</p>}</aside></div>
    </div>
  );
};

export default Panier;
