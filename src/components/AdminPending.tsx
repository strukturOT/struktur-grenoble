import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ClipboardCheck, ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pendingProducts, type PendingReasonKey } from '../lib/adminPending.mjs';
import { productImage, type StoreProduct } from '../lib/commerce';
import { getLegalContent, LEGAL_DOCUMENTS, type LegalContent } from '../lib/legalSettings';
import { isOutletProduct } from '../lib/catalogMembership.mjs';

export default function AdminPending({ products, loading, refreshKey }: { products: StoreProduct[]; loading: boolean; refreshKey: number }) {
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState<'all' | PendingReasonKey>('all');
  const [brand, setBrand] = useState('all');
  const [legal, setLegal] = useState<LegalContent | null>(null);
  const [legalError, setLegalError] = useState<string | null>(null);
  const items = useMemo(() => pendingProducts(products, { query, reason, brand }), [products, query, reason, brand]);
  const allPending = useMemo(() => pendingProducts(products), [products]);
  const brands = [...new Set(allPending.map(({ product }) => product.brand).filter((value): value is string => Boolean(value)))].sort();
  const outletEmpty = !products.some((product) => isOutletProduct(product) && product.status === 'active');

  useEffect(() => {
    let active = true;
    setLegal(null); setLegalError(null);
    void getLegalContent().then((current) => { if (active) setLegal(current); })
      .catch((caught: unknown) => { if (active) setLegalError(caught instanceof Error ? caught.message : 'Impossible de vérifier les textes.'); });
    return () => { active = false; };
  }, [refreshKey]);

  return <section className="py-4">
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-struktur-orange">Préparation de la boutique</p>
    <h1 className="font-display text-4xl sm:text-5xl">À confirmer</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">Retrouvez les fiches en brouillon avec du stock. Complétez les tailles, coloris et photos nécessaires, confirmez le bon modèle, puis choisissez « En ligne » dans la fiche pour la publier. L’enregistrement seul ne la publie pas.</p>

    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <div className="border border-white/15 p-5"><h2 className="font-display text-xl">Textes de la boutique</h2><p className="mt-3 text-sm leading-6 text-white/60">{legalError || (!legal ? 'Vérification des textes…' : Object.entries(LEGAL_DOCUMENTS).filter(([key]) => !legal[key as keyof LegalContent].trim()).map(([, item]) => item.title).join(' et ') || 'Les deux rubriques contiennent un texte.')}</p>{legal && Object.values(legal).some((text) => !text.trim()) && <p className="mt-2 text-xs text-struktur-orange">Textes à ajouter avant de finaliser la boutique.</p>}<Link to="/admin/informations-legales" className="mt-4 inline-flex items-center gap-2 text-xs text-struktur-orange underline underline-offset-4">Compléter les informations légales <ArrowUpRight size={14} /></Link></div>
      <div className="border border-white/15 p-5"><h2 className="font-display text-xl">Sélection Outlet</h2><p className="mt-3 text-sm leading-6 text-white/60">{outletEmpty ? 'Aucun produit n’est encore affecté à l’Outlet. Sélectionnez les fiches concernées dans le catalogue, puis choisissez « Ajouter à Outlet ». Leur marque et leur catégorie sont conservées.' : 'Ajoutez ou retirez les fiches de la sélection avec les actions Outlet du catalogue. Leur marque, leur catégorie et leurs prix sont conservés.'}</p><Link to="/admin/catalogue" className="mt-4 inline-flex items-center gap-2 text-xs text-struktur-orange underline underline-offset-4">Choisir les produits <ArrowUpRight size={14} /></Link></div>
    </div>

    <div className="mt-10 grid gap-4 border-y border-white/10 py-5 md:grid-cols-[minmax(0,1fr)_190px_210px]">
      <label className="text-[10px] uppercase tracking-[0.06em] text-white/55">Rechercher<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Produit, marque, référence ou code" className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal outline-none focus:border-struktur-orange" /></label>
      <label className="text-[10px] uppercase tracking-[0.06em] text-white/55">Marque<select value={brand} onChange={(event) => setBrand(event.target.value)} className="mt-2 w-full border border-white/15 bg-[#0b0b0c] px-3 py-3 text-sm normal-case tracking-normal"><option value="all">Toutes les marques</option>{brands.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="text-[10px] uppercase tracking-[0.06em] text-white/55">À compléter<select value={reason} onChange={(event) => setReason(event.target.value as typeof reason)} className="mt-2 w-full border border-white/15 bg-[#0b0b0c] px-3 py-3 text-sm normal-case tracking-normal"><option value="all">Toutes les fiches</option><option value="color">Coloris manquant</option><option value="size">Pointures / tailles à confirmer</option><option value="photo">Photo manquante</option><option value="identity">Modèle à confirmer</option><option value="publish">Prête à publier</option></select></label>
    </div>
    <p aria-live="polite" className="my-5 text-xs text-white/55">{loading ? 'Chargement des fiches…' : `${items.length} fiche${items.length > 1 ? 's' : ''} affichée${items.length > 1 ? 's' : ''} sur ${allPending.length} à confirmer`}</p>
    {!loading && !items.length && <div className="border border-white/10 p-8"><ClipboardCheck size={26} className="text-struktur-orange" /><p className="mt-4 text-sm text-white/65">{allPending.length ? 'Aucune fiche ne correspond à ces filtres.' : 'Aucune fiche en brouillon avec du stock à confirmer.'}</p></div>}
    <div className="space-y-4">{items.map(({ product, reasons, notes, stock }) => {
      const image = productImage(product);
      const refs = [...new Set(product.variants.map((variant) => variant.attributes.source_supplier_reference || variant.attributes.source_reference || variant.attributes.manufacturer_reference).filter(Boolean))];
      return <article key={product.id} className="grid gap-5 border border-white/10 p-5 sm:grid-cols-[88px_minmax(0,1fr)]">
        <div className="flex h-28 w-[88px] items-center justify-center bg-white/5">{image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-contain" /> : <ImageOff size={22} className="text-white/30" />}</div>
        <div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.06em] text-white/45">{product.brand || 'Sans marque'} · {stock} en stock</p><h2 className="mt-2 break-words font-display text-xl">{product.name}</h2>{refs.length > 0 && <p className="mt-2 break-all text-xs text-white/55">Référence : {refs.join(' · ')}</p>}<ul className="mt-4 flex flex-wrap gap-2">{reasons.map((item) => <li key={item.key} className="border border-struktur-orange/30 px-2 py-1 text-xs text-struktur-orange">{item.label}</li>)}</ul>{notes.map((note) => <p key={note} className="mt-3 text-xs leading-6 text-white/55">{note}</p>)}<Link to={`/admin/catalogue?produit=${encodeURIComponent(product.id)}`} className="mt-4 inline-flex min-h-10 items-center gap-2 border-b border-struktur-orange text-xs font-medium text-struktur-orange">Vérifier la fiche <ArrowUpRight size={14} /></Link></div>
      </article>;
    })}</div>
  </section>;
}
