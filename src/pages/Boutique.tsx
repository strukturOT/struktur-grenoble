import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import StorefrontState from '../components/StorefrontState';
import TextReveal from '../components/TextReveal';
import { useCategories, useProducts } from '../hooks/useProducts';
import { strukturAssets } from '../data/strukturAssets';

const Boutique = () => {
  const { products, loading, error } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const [searchParams] = useSearchParams();
  const activeCategorySlug = searchParams.get('categorie');
  const activeCategory = categories.find((category) => category.slug === activeCategorySlug) ?? null;
  const visibleProducts = activeCategory ? products.filter((product) => product.category?.id === activeCategory.id) : products;

  return (
    <div className="min-h-screen overflow-hidden pt-24 md:pt-32">
      <section className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-4 pb-20 md:grid-cols-12 md:gap-10 md:px-12 md:pb-32">
        <div className="flex flex-col justify-end px-2 pt-10 md:col-span-5 md:pb-12 md:pt-0">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }} className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-struktur-orange">
            Collection
          </motion.p>
          <TextReveal text="Boutique" className="text-6xl font-display tracking-tight sm:text-7xl md:text-8xl" />
          <TextReveal text="Pièces sélectionnées, à porter maintenant." className="mt-5 max-w-md text-lg font-light text-theme-ink/70 md:text-xl" delay={0.16} />
          <motion.a href="#collection" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }} className="group mt-10 inline-flex w-fit items-center gap-3 border-b border-theme-ink/30 pb-2 text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:border-struktur-orange hover:text-struktur-orange">
            Voir la sélection <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </motion.a>
        </div>
        <motion.div initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} transition={{ duration: 1.15, ease: [0.25, 0.1, 0.25, 1] }} className="relative aspect-[3/4] overflow-hidden bg-theme-surface md:col-span-7">
          <motion.img initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }} src={strukturAssets.boutique.collectionOneHero} alt="Nouvelle collection Struktur Grenoble" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/55 via-black/10 to-transparent p-6 text-white md:p-8">
            <p className="text-xs uppercase tracking-[0.25em]">Nouvelle collection</p><p className="text-xs uppercase tracking-[0.2em] text-white/70">Grenoble</p>
          </div>
        </motion.div>
      </section>
      <section id="collection" className="border-y border-theme-ink/10 bg-theme-section px-6 py-16 text-theme-section-ink md:px-12 md:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-struktur-orange">En ligne</p><TextReveal text="Le vestiaire du moment." className="text-4xl font-display md:text-6xl" /></div>
          <p className="max-w-md text-base font-light leading-relaxed text-theme-section-ink/65 md:text-lg">Chaque produit, taille, tarif et disponibilité est géré directement depuis l’administration de Struktur.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pt-16 md:px-12 md:pt-24">
        <div className="mb-8 flex items-end justify-between gap-6"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-struktur-orange">Explorer</p><h2 className="text-3xl font-display md:text-5xl">Les univers</h2></div><Link to="/boutique" className={`text-xs uppercase tracking-[0.18em] transition-colors hover:text-struktur-orange ${!activeCategorySlug ? 'text-struktur-orange' : 'text-theme-ink/45'}`}>Tout voir</Link></div>
        {categoriesLoading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="aspect-[1.15] animate-pulse bg-theme-surface" />)}</div> : categories.length > 0 ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{categories.map((category) => <Link key={category.id} to={`/categorie/${category.slug}`} className={`group relative aspect-[1.15] overflow-hidden bg-theme-surface ${activeCategory?.id === category.id ? 'ring-2 ring-struktur-orange ring-offset-2 ring-offset-theme-canvas' : ''}`}><div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/5">{category.imageUrl && <img src={category.imageUrl} alt={`Collection ${category.name}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}</div><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-5"><p className="text-[10px] uppercase tracking-[0.18em] text-white/70">{category.productCount} pièce{category.productCount !== 1 ? 's' : ''}</p><p className="mt-1 font-display text-xl md:text-2xl">{category.name}</p></div></Link>)}</div> : null}
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-12 md:py-32">
        <div id="selection" className="mb-12 flex items-center justify-between border-b border-theme-ink/10 pb-5 md:mb-16"><div><p className="text-xs uppercase tracking-[0.25em] text-theme-ink/50">{loading ? 'Chargement' : `${visibleProducts.length} pièce${visibleProducts.length > 1 ? 's' : ''}`}</p>{activeCategory && <p className="mt-2 font-display text-2xl">{activeCategory.name}</p>}</div><p className="text-xs uppercase tracking-[0.18em] text-theme-ink/40">Livraison & retrait à venir</p></div>
        {loading ? <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="aspect-[4/5] animate-pulse bg-theme-surface" />)}</div> : visibleProducts.length > 0 ? <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <StorefrontState error={activeCategory ? `Aucun produit n’est encore associé à la catégorie « ${activeCategory.name} ».` : error} />}
      </section>
    </div>
  );
};

export default Boutique;
