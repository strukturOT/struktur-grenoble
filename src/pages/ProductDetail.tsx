import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../cart/CartProvider';
import TextReveal from '../components/TextReveal';
import { useProduct } from '../hooks/useProducts';
import { formatMoney, productPrice } from '../lib/commerce';
import { isSupabaseConfigured } from '../lib/supabase';
import Seo from '../components/Seo';
import { breadcrumbJsonLd, productAnswers, productJsonLd, productSeoDescription } from '../lib/productSeo';
import { SITE_URL } from '../lib/site';

const ProductDetail = () => {
  const { slug } = useParams();
  const { product, loading, error } = useProduct(slug);
  const { addLine } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedColorway, setSelectedColorway] = useState<string | null>(null);
  const [wasAdded, setWasAdded] = useState(false);

  useEffect(() => {
    setSelectedVariantId(null);
    setSelectedColorway(null);
    setWasAdded(false);
  }, [slug]);

  if (loading) return <div className="min-h-screen px-6 pb-24 pt-32 md:px-12 md:pt-40"><div className="mx-auto max-w-7xl animate-pulse bg-theme-surface" style={{ aspectRatio: '4 / 3' }} /></div>;

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-32 text-center">
        <Seo title="Produit introuvable | STRUKTUR Grenoble" description="Cette fiche produit n’est pas disponible." path={`/produit/${slug || ''}`} noIndex />
        <h1 className="font-display text-3xl">{error ? 'Produit indisponible' : 'Produit introuvable'}</h1>
        <p className="mt-3 max-w-md text-sm font-light text-theme-ink/60">{isSupabaseConfigured ? 'Cette pièce n’est plus disponible dans la boutique en ligne.' : 'Le catalogue sera disponible après la configuration de la boutique.'}</p>
        <Link to="/boutique" className="mt-8 border-b border-struktur-orange pb-1 text-sm uppercase tracking-widest text-struktur-orange transition-colors hover:border-theme-ink hover:text-theme-ink">Retour à la boutique</Link>
      </div>
    );
  }

  const colorways = [...new Set(product.variants.map((variant) => variant.attributes.colorway).filter((colorway): colorway is string => Boolean(colorway)))];
  const hasColorways = product.brand?.toLowerCase() === 'saucony' && colorways.length > 0;
  const currentColorway = hasColorways ? (selectedColorway && colorways.includes(selectedColorway) ? selectedColorway : colorways[0]) : null;
  const colorVariants = hasColorways ? product.variants.filter((variant) => variant.attributes.colorway === currentColorway) : product.variants;
  const selectedVariant = colorVariants.find((variant) => variant.id === selectedVariantId) ?? colorVariants[0];
  const visibleImages = hasColorways ? product.images.filter((image) => image.colorway === currentColorway) : product.images;
  const chosenPrice = selectedVariant?.priceCents ?? productPrice(product);
  const isAvailable = (selectedVariant?.stockQuantity ?? 0) > 0;
  const answers = productAnswers(product);
  const productUrl = `${SITE_URL}/produit/${product.slug}`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: answers.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !isAvailable) return;
    const selectedImage = visibleImages[0] ?? product.images[0];
    const variantName = hasColorways ? `${currentColorway} · EU ${selectedVariant.name || selectedVariant.attributes.size || ''}` : selectedVariant.name;
    addLine({ variantId: selectedVariant.id, productId: product.id, name: product.name, brand: product.brand, variantName, imageUrl: selectedImage?.imageUrl ?? null, priceCents: chosenPrice, currency: product.currency });
    setWasAdded(true);
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 pb-24 pt-28 md:px-12 md:pb-32 md:pt-36">
      <Seo title={product.seoTitle?.trim() || `${product.name}${product.brand ? ` par ${product.brand}` : ''} | STRUKTUR`} description={productSeoDescription(product)} path={`/produit/${product.slug}`} image={visibleImages[0]?.imageUrl ?? product.images[0]?.imageUrl} type="product" noIndex={product.slug.toLowerCase().startsWith('test-')} jsonLd={[productJsonLd(product, SITE_URL), faqSchema, breadcrumbJsonLd([{ name: 'Accueil', url: SITE_URL }, { name: 'Boutique', url: `${SITE_URL}/boutique` }, { name: product.name, url: productUrl }])]} />
      <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7"><div className="grid gap-4 md:gap-6">{visibleImages.length > 0 ? visibleImages.map((image, index) => <motion.div key={image.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: index * 0.08 }} className={`${hasColorways ? 'aspect-square bg-white' : 'aspect-[4/5] bg-theme-surface'} overflow-hidden`}><img src={image.imageUrl} alt={image.altText || `${product.name}, vue ${index + 1}`} className={`h-full w-full ${hasColorways ? 'object-contain' : 'object-cover'}`} /></motion.div>) : <div className="flex aspect-[4/5] items-end bg-theme-surface p-6 text-xs uppercase tracking-[0.22em] text-theme-ink/35">Visuel à venir</div>}</div></div>
        <div className="md:col-span-5"><div data-lenis-prevent className="md:sticky md:top-32 md:max-h-[calc(100vh-9rem)] md:overflow-y-auto md:overscroll-contain md:pr-2">
          {product.brand && <TextReveal text={product.brand} className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-struktur-orange" />}
          <TextReveal text={product.name} className="text-4xl font-display leading-[1.05] md:text-6xl" delay={0.08} />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-5 text-xl font-light md:text-2xl">{formatMoney(chosenPrice, product.currency)}</motion.p>
          {product.description && <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-theme-ink/65">{product.description}</p>}
          {hasColorways && <section className="mt-9" aria-label="Choix du coloris"><div className="mb-4 flex items-end justify-between gap-4"><p className="text-xs font-medium uppercase tracking-[0.2em]">Choisir un coloris</p><p className="text-[10px] uppercase tracking-[0.12em] text-theme-ink/55">{currentColorway}</p></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{colorways.map((colorway) => { const swatchImage = product.images.find((image) => image.colorway === colorway); const active = colorway === currentColorway; return <button type="button" key={colorway} aria-label={`Choisir le coloris ${colorway}`} aria-pressed={active} onClick={() => { setSelectedColorway(colorway); setSelectedVariantId(null); setWasAdded(false); }} className={`group overflow-hidden border text-left transition-colors ${active ? 'border-theme-ink ring-1 ring-theme-ink' : 'border-theme-ink/15 hover:border-theme-ink/55'}`}><span className="block aspect-[1.35] bg-theme-surface p-1.5"><img src={swatchImage?.imageUrl} alt="" className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105" loading="lazy" /></span><span className="block px-2 py-2 text-[10px] leading-tight text-theme-ink/70">{colorway}</span></button>; })}</div></section>}
          <div className="mt-8 border-y border-theme-ink/10 py-6"><div className="mb-4 flex items-end justify-between"><p className="text-xs font-medium uppercase tracking-[0.2em]">Choisir une taille</p><p className="text-[10px] uppercase tracking-[0.15em] text-theme-ink/45">Stock en direct</p></div><div className="grid grid-cols-4 gap-2">{colorVariants.map((variant) => { const active = selectedVariant?.id === variant.id; const soldOut = variant.stockQuantity < 1; return <button type="button" key={variant.id} disabled={soldOut} onClick={() => { setSelectedVariantId(variant.id); setWasAdded(false); }} className={`min-h-12 border px-2 text-xs transition-colors ${active ? 'border-theme-ink bg-theme-ink text-theme-canvas' : 'border-theme-ink/20 hover:border-theme-ink/60'} ${soldOut ? 'cursor-not-allowed opacity-40 line-through' : ''}`}>{hasColorways ? `EU ${variant.attributes.size || variant.name}` : variant.name || variant.sku}</button>; })}</div>{hasColorways && colorVariants.every((variant) => variant.stockQuantity < 1) && <p className="mt-3 text-xs text-theme-ink/50">Aucune taille disponible dans ce coloris pour le moment.</p>}</div>
          <button type="button" disabled={!isAvailable || !selectedVariant} onClick={handleAddToCart} className={`mt-6 flex w-full items-center justify-center gap-3 py-5 text-xs font-medium uppercase tracking-[0.2em] transition-colors ${isAvailable ? wasAdded ? 'bg-theme-ink text-theme-canvas' : 'bg-struktur-orange text-white hover:bg-[#ff5511]' : 'cursor-not-allowed bg-theme-ink/10 text-theme-ink/35'}`}>{wasAdded ? <Check size={16} /> : <ShoppingBag size={16} />}{!isAvailable ? 'Indisponible' : wasAdded ? 'Ajouté au panier' : 'Ajouter au panier'}</button>
          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.16em] text-theme-ink/45">Livraison et paiement sécurisés bientôt disponibles</p>
        </div></div>
      </div>
      <section className="mt-20 border-t border-theme-ink/10 pt-14 md:mt-28 md:pt-20">
        <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
          <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-struktur-orange">Guide d’achat</p><h2 className="font-display text-4xl md:text-5xl">Questions sur cette pièce</h2><p className="mt-5 max-w-md text-sm font-light leading-7 text-theme-ink/60">Prix, variantes et disponibilité sont synchronisés avec le catalogue de la boutique.</p><Link to={`/journal/${product.slug}`} className="mt-7 inline-block border-b border-theme-ink/30 pb-1 text-xs uppercase tracking-[0.18em] transition-colors hover:border-struktur-orange hover:text-struktur-orange">Lire le guide complet</Link></div>
          <div className="divide-y divide-theme-ink/10 border-y border-theme-ink/10">{answers.map((item) => <details key={item.question} className="py-5"><summary className="cursor-pointer list-none pr-8 font-display text-xl marker:content-none">{item.question}</summary><p className="mt-4 max-w-2xl text-sm font-light leading-7 text-theme-ink/65">{item.answer}</p></details>)}</div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
