import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../cart/CartProvider';
import TextReveal from '../components/TextReveal';
import { useProduct } from '../hooks/useProducts';
import { formatMoney, productPrice } from '../lib/commerce';
import { isSupabaseConfigured } from '../lib/supabase';

const ProductDetail = () => {
  const { slug } = useParams();
  const { product, loading, error } = useProduct(slug);
  const { addLine } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [wasAdded, setWasAdded] = useState(false);

  useEffect(() => {
    setSelectedVariantId(null);
    setWasAdded(false);
  }, [slug]);

  if (loading) return <div className="min-h-screen px-6 pb-24 pt-32 md:px-12 md:pt-40"><div className="mx-auto max-w-7xl animate-pulse bg-theme-surface" style={{ aspectRatio: '4 / 3' }} /></div>;

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-32 text-center">
        <h1 className="font-display text-3xl">{error ? 'Produit indisponible' : 'Produit introuvable'}</h1>
        <p className="mt-3 max-w-md text-sm font-light text-theme-ink/60">{isSupabaseConfigured ? 'Cette pièce n’est plus disponible dans la boutique en ligne.' : 'Le catalogue sera disponible après la configuration de la boutique.'}</p>
        <Link to="/boutique" className="mt-8 border-b border-struktur-orange pb-1 text-sm uppercase tracking-widest text-struktur-orange transition-colors hover:border-theme-ink hover:text-theme-ink">Retour à la boutique</Link>
      </div>
    );
  }

  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  const chosenPrice = selectedVariant?.priceCents ?? productPrice(product);
  const isAvailable = (selectedVariant?.stockQuantity ?? 0) > 0;

  const handleAddToCart = () => {
    if (!selectedVariant || !isAvailable) return;
    addLine({ variantId: selectedVariant.id, productId: product.id, name: product.name, brand: product.brand, variantName: selectedVariant.name, imageUrl: product.images[0]?.imageUrl ?? null, priceCents: chosenPrice, currency: product.currency });
    setWasAdded(true);
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 pb-24 pt-28 md:px-12 md:pb-32 md:pt-36">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7"><div className="grid gap-4 md:gap-6">{product.images.length > 0 ? product.images.map((image, index) => <motion.div key={image.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: index * 0.08 }} className="aspect-[4/5] overflow-hidden bg-theme-surface"><img src={image.imageUrl} alt={image.altText || `${product.name}, vue ${index + 1}`} className="h-full w-full object-cover" /></motion.div>) : <div className="flex aspect-[4/5] items-end bg-theme-surface p-6 text-xs uppercase tracking-[0.22em] text-theme-ink/35">Visuel à venir</div>}</div></div>
        <div className="md:col-span-5"><div className="md:sticky md:top-32">
          {product.brand && <TextReveal text={product.brand} className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-struktur-orange" />}
          <TextReveal text={product.name} className="text-4xl font-display leading-[1.05] md:text-6xl" delay={0.08} />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-5 text-xl font-light md:text-2xl">{formatMoney(chosenPrice, product.currency)}</motion.p>
          {product.description && <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-theme-ink/65">{product.description}</p>}
          <div className="mt-10 border-y border-theme-ink/10 py-6"><div className="mb-4 flex items-end justify-between"><p className="text-xs font-medium uppercase tracking-[0.2em]">Choisir une taille</p><p className="text-[10px] uppercase tracking-[0.15em] text-theme-ink/45">Stock en direct</p></div><div className="grid grid-cols-4 gap-2">{product.variants.map((variant) => { const active = selectedVariant?.id === variant.id; const soldOut = variant.stockQuantity < 1; return <button type="button" key={variant.id} disabled={soldOut} onClick={() => { setSelectedVariantId(variant.id); setWasAdded(false); }} className={`min-h-12 border px-2 text-xs transition-colors ${active ? 'border-theme-ink bg-theme-ink text-theme-canvas' : 'border-theme-ink/20 hover:border-theme-ink/60'} ${soldOut ? 'cursor-not-allowed opacity-30 line-through' : ''}`}>{variant.name || variant.sku}</button>; })}</div></div>
          <button type="button" disabled={!isAvailable || !selectedVariant} onClick={handleAddToCart} className={`mt-6 flex w-full items-center justify-center gap-3 py-5 text-xs font-medium uppercase tracking-[0.2em] transition-colors ${isAvailable ? wasAdded ? 'bg-theme-ink text-theme-canvas' : 'bg-struktur-orange text-white hover:bg-[#ff5511]' : 'cursor-not-allowed bg-theme-ink/10 text-theme-ink/35'}`}>{wasAdded ? <Check size={16} /> : <ShoppingBag size={16} />}{!isAvailable ? 'Indisponible' : wasAdded ? 'Ajouté au panier' : 'Ajouter au panier'}</button>
          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.16em] text-theme-ink/45">Livraison et paiement sécurisés bientôt disponibles</p>
        </div></div>
      </div>
    </div>
  );
};

export default ProductDetail;
