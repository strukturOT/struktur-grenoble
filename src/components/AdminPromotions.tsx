import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, CalendarClock, Check, ImageOff, Pause, Percent, Plus, Search, Tag, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatMoney, productImage, saveProductPromotion, type ProductPromotion, type StoreProduct } from '../lib/commerce';
import { productPricing, promotionState } from '../lib/promotions.mjs';
import { filterAdminCatalog } from '../lib/adminCatalog.mjs';

type PromotionStatus = ReturnType<typeof promotionState>;
type StatusFilter = PromotionStatus | 'all' | 'configured';
type Notice = { text: string; error?: boolean };
type PromotionForm = { type: ProductPromotion['type']; amount: string; enabled: boolean; startsAt: string; endsAt: string };

const labels: Record<PromotionStatus, string> = { none: 'Sans promotion', inactive: 'Désactivée', scheduled: 'Programmée', expired: 'Terminée', active: 'En cours' };
const fieldClass = 'mt-2 min-h-12 w-full border border-[#181715]/20 bg-white px-3 py-3 text-sm text-[#181715] outline-none focus:border-struktur-orange disabled:opacity-50';
const dateLabel = (date: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
const toLocalDate = (date: string | null) => {
  if (!date || !Number.isFinite(new Date(date).getTime())) return '';
  const value = new Date(date);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
};

function readPromotion(form: PromotionForm, product: StoreProduct): ProductPromotion {
  const number = Number(form.amount.replace(',', '.'));
  if (!form.amount.trim() || !Number.isFinite(number)) throw new Error('Renseignez une remise ou un prix valide.');
  const value = form.type === 'percentage' ? number : Math.round(number * 100);
  if (form.type === 'percentage' && (!Number.isInteger(value) || value < 1 || value > 99)) throw new Error('La remise doit être un nombre entier entre 1 et 99 %.');
  if (form.type === 'fixed_price') {
    if (!Number.isSafeInteger(value) || value < 1 || Math.abs(number * 100 - value) > 0.000001) throw new Error('Le prix final doit être positif, avec deux décimales maximum.');
    const prices = product.variants.map((variant) => variant.priceCents ?? product.priceCents).filter((price) => Number.isSafeInteger(price) && price > 0);
    if (!prices.length && Number.isSafeInteger(product.priceCents) && product.priceCents > 0) prices.push(product.priceCents);
    if (!prices.length || value >= Math.min(...prices)) throw new Error('Le prix final doit être inférieur au prix de base de chaque variante.');
  }
  const parseDate = (date: string) => {
    if (!date) return null;
    const parsed = new Date(date);
    if (!Number.isFinite(parsed.getTime())) throw new Error('Vérifiez les dates de la promotion.');
    return parsed.toISOString();
  };
  const startsAt = parseDate(form.startsAt);
  const endsAt = parseDate(form.endsAt);
  if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) throw new Error('La fin doit être postérieure au début de la promotion.');
  return { type: form.type, value, enabled: form.enabled, startsAt, endsAt };
}

const offerLabel = (promotion: ProductPromotion, currency: string) => promotion.type === 'percentage' ? `−${promotion.value} %` : `${formatMoney(promotion.value, currency)} · prix final`;

function StateBadge({ state }: { state: PromotionStatus }) {
  return <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.06em] ${state === 'active' ? 'border-struktur-orange/25 bg-struktur-orange/10 text-struktur-orange' : 'border-[#181715]/15 text-[#181715]/60'}`}>
    {state === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-struktur-orange" />}{state === 'scheduled' && <CalendarClock size={12} />}{labels[state]}
  </span>;
}

export default function AdminPromotions({ products, loading, error, onSaved }: { products: StoreProduct[]; loading: boolean; error?: string | null; onSaved: () => Promise<void> }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('all');
  const [filter, setFilter] = useState<StatusFilter>('configured');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  const selectedId = searchParams.get('produit');
  const selectedProduct = selectedId ? products.find((product) => product.id === selectedId) : undefined;
  const counts = useMemo(() => products.reduce((result, product) => { result[promotionState(product.promotion, now)]++; return result; }, { none: 0, inactive: 0, scheduled: 0, expired: 0, active: 0 }), [products, now]);
  const brands = useMemo(() => [...new Set(products.map((product) => product.brand).filter((value): value is string => Boolean(value)))].sort(), [products]);
  const visible = useMemo(() => filterAdminCatalog(products, { query }).filter((product) => (brand === 'all' || product.brand === brand) && (filter === 'all' || filter === 'configured' && Boolean(product.promotion) || promotionState(product.promotion, now) === filter)), [products, query, brand, filter, now]);
  const openProduct = (id: string) => { setNotice(null); setSearchParams((current) => { const next = new URLSearchParams(current); next.set('produit', id); return next; }); };
  const closeProduct = () => setSearchParams((current) => { const next = new URLSearchParams(current); next.delete('produit'); return next; }, { replace: true });
  const chooseProduct = () => { setFilter('all'); setQuery(''); setBrand('all'); searchRef.current?.focus(); };

  const disable = async (product: StoreProduct) => {
    if (!product.promotion) return;
    setBusyId(product.id); setNotice(null);
    try {
      await saveProductPromotion(product.id, { ...product.promotion, enabled: false }, product.updatedAt);
      await onSaved();
      setNotice({ text: `La promotion de « ${product.name} » est désactivée. Le prix de base s’applique.` });
    } catch (caught) { setNotice({ text: caught instanceof Error ? caught.message : 'Impossible de désactiver la promotion. Réessayez.', error: true }); }
    finally { setBusyId(null); }
  };

  return <section className="py-4 text-[#181715]">
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-struktur-orange">Prix & offres</p><h1 className="font-display text-4xl sm:text-5xl">Promotions</h1><p className="mt-4 max-w-xl text-sm leading-7 text-[#181715]/60">Préparez une offre, vérifiez son prix puis activez-la au bon moment. Les prix de base et le stock sont conservés.</p></div>
      <button type="button" onClick={chooseProduct} disabled={loading || Boolean(error)} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 bg-struktur-orange px-5 py-3 text-xs font-medium uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#e94709] disabled:opacity-50"><Plus size={17} />Créer une promotion</button>
    </div>

    <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{(['active', 'scheduled', 'inactive', 'expired'] as const).map((state) => <button key={state} type="button" onClick={() => setFilter(state)} aria-pressed={filter === state} className={`border p-5 text-left transition-colors ${filter === state ? 'border-struktur-orange bg-struktur-orange/5' : 'border-[#181715]/12 hover:border-struktur-orange/50'}`}><span className="text-[10px] uppercase tracking-[0.06em] text-[#181715]/60">{state === 'active' ? 'En cours' : state === 'scheduled' ? 'Programmées' : state === 'inactive' ? 'Désactivées' : 'Terminées'}</span><span className={`mt-3 block font-display text-3xl ${state === 'active' ? 'text-struktur-orange' : ''}`}>{loading ? '—' : counts[state]}</span></button>)}</div>

    <div className="mt-8 grid gap-4 border-y border-[#181715]/12 py-5 lg:grid-cols-[minmax(0,1fr)_180px_200px]">
      <label className="text-[10px] uppercase tracking-[0.06em] text-[#181715]/55">Rechercher un produit<div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-6 text-[#181715]/40" /><input id="promotion-product-search" ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, marque, référence…" className={`${fieldClass} pl-10`} /></div></label>
      <label className="text-[10px] uppercase tracking-[0.06em] text-[#181715]/55">Marque<select value={brand} onChange={(event) => setBrand(event.target.value)} className={fieldClass}><option value="all">Toutes les marques</option>{brands.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="text-[10px] uppercase tracking-[0.06em] text-[#181715]/55">Afficher<select value={filter} onChange={(event) => setFilter(event.target.value as StatusFilter)} className={fieldClass}><option value="configured">Toutes les promotions</option><option value="all">Tous les produits</option><option value="active">En cours</option><option value="scheduled">Programmées</option><option value="inactive">Désactivées</option><option value="expired">Terminées</option><option value="none">Sans promotion</option></select></label>
    </div>
    {notice && <p role={notice.error ? 'alert' : 'status'} className={`mt-5 border p-4 text-sm leading-6 ${notice.error ? 'border-[#8b2f18]/30 text-[#8b2f18]' : 'border-struktur-orange/25 bg-struktur-orange/5'}`}>{notice.text}</p>}
    {error && <div role="alert" className="mt-5 border border-[#8b2f18]/30 p-5 text-sm text-[#8b2f18]"><p>{error}</p><button type="button" onClick={() => void onSaved()} className="mt-3 underline underline-offset-4">Réessayer</button></div>}
    {selectedId && !selectedProduct && !loading && !error && <p role="alert" className="mt-5 border border-struktur-orange/30 p-4 text-sm">Ce produit est introuvable. <button type="button" onClick={closeProduct} className="underline underline-offset-4">Fermer la sélection</button></p>}
    <p aria-live="polite" className="my-5 text-xs text-[#181715]/55">{loading ? 'Chargement des produits…' : error ? 'Le catalogue est momentanément indisponible.' : `${visible.length} produit${visible.length !== 1 ? 's' : ''} affiché${visible.length !== 1 ? 's' : ''}`}</p>
    {!loading && !error && !visible.length && <div className="border border-dashed border-[#181715]/20 px-6 py-12 text-center"><Tag size={28} className="mx-auto text-struktur-orange" /><h2 className="mt-4 font-display text-2xl">{products.length && filter === 'configured' && !query && brand === 'all' ? 'Votre prochaine offre commence ici.' : 'Aucun produit ne correspond.'}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#181715]/60">Choisissez un produit du catalogue pour préparer une remise ou un prix final. Les brouillons restent en brouillon.</p><button type="button" onClick={chooseProduct} className="mt-5 min-h-11 border-b border-struktur-orange text-xs font-medium text-struktur-orange">Choisir un produit <ArrowUpRight size={14} className="ml-1 inline" /></button></div>}
    {!error && <div className="space-y-3">{visible.map((product) => {
      const state = promotionState(product.promotion, now);
      const pricing = productPricing(product, now);
      const image = productImage(product);
      return <article key={product.id} className="grid gap-5 border border-[#181715]/12 p-4 sm:grid-cols-[72px_minmax(0,1fr)] sm:p-5 xl:grid-cols-[72px_minmax(0,1fr)_auto]">
        <div className="flex h-24 w-[72px] items-center justify-center bg-white">{image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-contain" /> : <ImageOff size={20} className="text-[#181715]/30" />}</div>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><p className="text-[10px] uppercase tracking-[0.06em] text-[#181715]/50">{product.brand || 'Sans marque'} · {product.status === 'active' ? 'En ligne' : product.status === 'draft' ? 'Brouillon' : 'Archivé'}</p><StateBadge state={state} /></div><h2 className="mt-2 break-words font-display text-xl">{product.name}</h2><div className="mt-3 flex flex-wrap items-baseline gap-3">{pricing.discounted && <del className="text-sm text-[#181715]/45">{formatMoney(pricing.originalPriceCents, product.currency)}</del>}<span className={`text-lg font-medium ${pricing.discounted ? 'text-struktur-orange' : ''}`}>{pricing.hasPriceRange && <span className="mr-1 text-xs font-normal">Dès</span>}{formatMoney(pricing.priceCents, product.currency)}</span>{product.promotion && <span className="text-xs text-[#181715]/55">{offerLabel(product.promotion, product.currency)}</span>}</div>{product.promotion?.startsAt && state === 'scheduled' && <p className="mt-2 text-xs text-[#181715]/55">Début le {dateLabel(product.promotion.startsAt)}</p>}{product.promotion?.endsAt && state === 'active' && <p className="mt-2 text-xs text-[#181715]/55">Jusqu’au {dateLabel(product.promotion.endsAt)}</p>}</div>
        <div className="flex flex-wrap items-center gap-4 sm:col-start-2 xl:col-start-auto xl:flex-col xl:items-end xl:justify-center"><button type="button" disabled={busyId !== null || loading} onClick={() => openProduct(product.id)} className="inline-flex min-h-11 items-center gap-2 border border-[#181715]/20 px-4 text-xs font-medium hover:border-struktur-orange hover:text-struktur-orange disabled:opacity-50">{product.promotion ? 'Modifier l’offre' : 'Créer une offre'}<ArrowUpRight size={14} /></button>{product.promotion?.enabled && state !== 'expired' && <button type="button" disabled={busyId !== null || loading} onClick={() => void disable(product)} className="inline-flex min-h-10 items-center gap-1.5 text-xs text-[#181715]/60 underline underline-offset-4 hover:text-struktur-orange disabled:opacity-50"><Pause size={13} />{busyId === product.id ? 'Enregistrement…' : 'Désactiver'}</button>}</div>
      </article>;
    })}</div>}
    {selectedProduct && <PromotionEditor key={selectedProduct.id} product={selectedProduct} onClose={closeProduct} onSaved={async (text) => { await onSaved(); closeProduct(); setNotice({ text }); }} />}
  </section>;
}

function PromotionEditor({ product, onClose, onSaved }: { product: StoreProduct; onClose: () => void; onSaved: (message: string) => Promise<void> }) {
  const [snapshot] = useState(product);
  const [form, setForm] = useState<PromotionForm>(() => ({ type: product.promotion?.type ?? 'percentage', amount: product.promotion ? String(product.promotion.type === 'percentage' ? product.promotion.value : (product.promotion.value / 100).toFixed(2)) : '', enabled: product.promotion?.enabled ?? false, startsAt: toLocalDate(product.promotion?.startsAt ?? null), endsAt: toLocalDate(product.promotion?.endsAt ?? null) }));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [returnTarget] = useState(() => document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
      window.requestAnimationFrame(() => {
        // A newly opened editor owns focus; otherwise return to the invoking control.
        if (document.getElementById('promotion-editor-title')) return;
        if (returnTarget?.isConnected && returnTarget !== document.body) returnTarget.focus();
        else document.getElementById('promotion-product-search')?.focus();
      });
    };
  }, [returnTarget]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      const targets = panel ? [...panel.querySelectorAll<HTMLElement>('a[href]:not([tabindex="-1"]), button:enabled, input:enabled, select:enabled, textarea:enabled')].filter((element) => element.getClientRects().length > 0) : [];
      if (!targets.length) { event.preventDefault(); panel?.focus(); return; }
      const first = targets[0], last = targets[targets.length - 1];
      const outside = !panel?.contains(document.activeElement);
      if (event.shiftKey && (outside || document.activeElement === first)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (outside || document.activeElement === last)) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [saving]);
  let candidate: ProductPromotion | null = null;
  let validation: string | null = null;
  try { candidate = readPromotion(form, snapshot); } catch (caught) { validation = caught instanceof Error ? caught.message : 'Vérifiez les paramètres.'; }
  const preview = productPricing({ ...snapshot, promotion: candidate ? { ...candidate, enabled: true, startsAt: null, endsAt: null } : null });
  const candidateState = promotionState(candidate);
  const image = productImage(snapshot);

  const persist = async (promotion: ProductPromotion | null) => {
    setSaving(true); setMessage(null);
    try {
      await saveProductPromotion(snapshot.id, promotion, snapshot.updatedAt);
      await onSaved(promotion ? `La promotion de « ${snapshot.name} » a été enregistrée${promotion.enabled ? '' : ' et reste désactivée'}.` : `La promotion de « ${snapshot.name} » est retirée. Le prix de base s’applique.`);
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'Impossible d’enregistrer la promotion. Réessayez.'); }
    finally { setSaving(false); }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); try { void persist(readPromotion(form, snapshot)); } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'Vérifiez les paramètres.'); } };

  return <div className="fixed inset-0 z-[90] flex justify-end">
    <button type="button" aria-label="Fermer la promotion" disabled={saving} onClick={onClose} className="absolute inset-0 cursor-default bg-black/35 backdrop-blur-sm" />
    <aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="promotion-editor-title" tabIndex={-1} className="relative h-full w-full max-w-xl overflow-y-auto bg-[#faf9f7] p-6 text-[#181715] shadow-2xl sm:p-9">
      <div className="flex items-start justify-between gap-4 border-b border-[#181715]/12 pb-6"><div><p className="mb-3 text-[10px] uppercase tracking-[0.06em] text-struktur-orange">Prix & offres</p><h2 id="promotion-editor-title" className="font-display text-3xl">{snapshot.promotion ? 'Modifier la promotion' : 'Créer une promotion'}</h2></div><button type="button" onClick={onClose} disabled={saving} aria-label="Fermer" className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center hover:text-struktur-orange disabled:opacity-40"><X size={22} /></button></div>
      <div className="mt-6 flex gap-4"><div className="flex h-20 w-16 shrink-0 items-center justify-center bg-white">{image ? <img src={image} alt="" className="h-full w-full object-contain" /> : <ImageOff size={20} className="text-[#181715]/30" />}</div><div><p className="text-[10px] uppercase tracking-[0.06em] text-[#181715]/50">{snapshot.brand || 'Sans marque'}</p><h3 className="mt-2 font-display text-xl">{snapshot.name}</h3><Link to={`/admin/catalogue?produit=${encodeURIComponent(snapshot.id)}`} className="mt-2 inline-flex items-center gap-1 text-xs text-[#181715]/60 underline underline-offset-4">Ouvrir la fiche <ArrowUpRight size={12} /></Link></div></div>
      {snapshot.status !== 'active' && <p className="mt-5 border-l-2 border-struktur-orange pl-3 text-xs leading-6 text-[#181715]/65">Ce produit est {snapshot.status === 'draft' ? 'en brouillon' : 'archivé'}. Préparer une promotion ne le publie pas.</p>}
      <form onSubmit={submit} className="mt-7">
        <fieldset disabled={saving} className="space-y-7">
          <div><p className="text-[10px] uppercase tracking-[0.06em] text-[#181715]/55">Type de réduction</p><div className="mt-3 grid grid-cols-2 gap-3">{([{ value: 'percentage', label: 'Pourcentage', icon: Percent }, { value: 'fixed_price', label: 'Prix final', icon: Tag }] as const).map(({ value, label, icon: Icon }) => <label key={value} className={`flex min-h-14 cursor-pointer items-center gap-2 border px-4 text-sm ${form.type === value ? 'border-struktur-orange bg-struktur-orange/5' : 'border-[#181715]/20'}`}><input type="radio" name="promotion-type" value={value} checked={form.type === value} onChange={() => { setForm({ ...form, type: value, amount: '' }); setMessage(null); }} className="accent-struktur-orange" /><Icon size={15} />{label}</label>)}</div></div>
          <label className="block text-[10px] uppercase tracking-[0.06em] text-[#181715]/55">{form.type === 'percentage' ? 'Remise (%)' : 'Prix final (€)'}<input autoFocus required type="number" inputMode="decimal" min={form.type === 'percentage' ? 1 : 0.01} max={form.type === 'percentage' ? 99 : undefined} step={form.type === 'percentage' ? 1 : 0.01} value={form.amount} onChange={(event) => { setForm({ ...form, amount: event.target.value }); setMessage(null); }} placeholder={form.type === 'percentage' ? 'Ex. 20' : 'Ex. 89,00'} className={fieldClass} /><span className="mt-2 block text-xs normal-case leading-6 tracking-normal text-[#181715]/50">L’offre s’applique à toutes les variantes de ce produit. Le prix final doit être inférieur à chacun de leurs prix de base.</span></label>
          <div className="border border-[#181715]/12 bg-white p-5"><div className="flex items-center justify-between gap-3"><p className="text-[10px] uppercase tracking-[0.06em] text-[#181715]/55">Aperçu du prix en promotion</p>{candidate && <span className="bg-struktur-orange px-2 py-1 text-xs font-medium text-white">{preview.discounted && preview.percentage > 0 ? `−${preview.percentage} %` : "Promotion"}</span>}</div><div className="mt-4 flex flex-wrap items-baseline gap-3">{candidate && preview.discounted && <del className="text-lg text-[#181715]/40">{formatMoney(preview.originalPriceCents, snapshot.currency)}</del>}<span className="font-display text-4xl text-struktur-orange">{preview.hasPriceRange && <span className="mr-1 text-sm">Dès</span>}{formatMoney(preview.priceCents, snapshot.currency)}</span></div><p className="mt-3 text-xs leading-6 text-[#181715]/55">{candidate ? 'Ce prix s’affichera lorsque l’offre sera activée et dans sa période de validité.' : validation || 'Renseignez la réduction pour voir le prix final.'}</p></div>
          <div><p className="mb-3 text-[10px] uppercase tracking-[0.06em] text-[#181715]/55">Calendrier facultatif</p><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#181715]/65">Début<input type="datetime-local" value={form.startsAt} onChange={(event) => { setForm({ ...form, startsAt: event.target.value }); setMessage(null); }} className={fieldClass} /></label><label className="text-xs text-[#181715]/65">Fin<input type="datetime-local" value={form.endsAt} onChange={(event) => { setForm({ ...form, endsAt: event.target.value }); setMessage(null); }} className={fieldClass} /></label></div><p className="mt-2 text-xs leading-6 text-[#181715]/50">Heure locale de cet appareil. Sans date de début, l’activation est immédiate. Sans date de fin, l’offre reste valable jusqu’à sa désactivation.</p></div>
          <div className="border-y border-[#181715]/12 py-5"><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={form.enabled} onChange={(event) => { setForm({ ...form, enabled: event.target.checked }); setMessage(null); }} className="mt-1 h-4 w-4 shrink-0 accent-struktur-orange" /><span className="leading-6">Activer cette promotion<span className="mt-1 block text-xs text-[#181715]/55">{form.enabled ? 'L’offre suit les dates ci-dessus dès son enregistrement.' : 'L’offre sera enregistrée sans modifier le prix affiché.'}</span></span></label>{candidate && <div className="mt-4"><StateBadge state={candidateState} />{candidateState === 'expired' && <p className="mt-2 text-xs leading-6 text-[#181715]/60">La date de fin est passée. Modifiez-la pour relancer cette offre.</p>}</div>}</div>
          {message && <p role="alert" className="border border-[#8b2f18]/30 p-4 text-sm leading-6 text-[#8b2f18]">{message}</p>}
          <button type="submit" disabled={saving || Boolean(validation)} className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 bg-struktur-orange px-5 py-4 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#e94709] disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Enregistrement…' : <><Check size={16} />{form.enabled ? 'Enregistrer la promotion' : 'Enregistrer sans activer'}</>}</button>
          {snapshot.promotion && <button type="button" onClick={() => void persist(null)} className="min-h-11 w-full text-xs text-[#181715]/60 underline underline-offset-4 hover:text-struktur-orange">Retirer la promotion et revenir au prix de base</button>}
        </fieldset>
      </form>
    </aside>
  </div>;
}
