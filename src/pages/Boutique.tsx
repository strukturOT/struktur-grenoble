import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import { useCategories, useProducts } from '../hooks/useProducts';
import { productPrice } from '../lib/commerce';

export default function Boutique() {
  const { products, loading, error } = useProducts({ order: 'mixed' });
  const { categories, loading: categoriesLoading } = useCategories();
  const [searchParams] = useSearchParams();
  const [sort, setSort] = useState('selection');
  const activeCategory = categories.find((category) => category.slug === searchParams.get('categorie')) ?? null;
  let visibleProducts = activeCategory ? products.filter((product) => product.category?.id === activeCategory.id) : products;
  if (sort === 'price-low') visibleProducts = [...visibleProducts].sort((a, b) => productPrice(a) - productPrice(b));
  if (sort === 'price-high') visibleProducts = [...visibleProducts].sort((a, b) => productPrice(b) - productPrice(a));
  if (sort === 'newest') visibleProducts = [...visibleProducts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] px-4 pb-20 pt-28 md:px-10 md:pb-28 md:pt-36 lg:px-14">
      <header className="mb-8 md:mb-10">
        <h1 className="font-display text-4xl font-medium md:text-6xl">La boutique.</h1>
        <p className="mt-3 text-sm text-theme-ink/65 md:text-base">Streetwear, sneakers et accessoires. La sélection STRUKTUR.</p>
      </header>
      <nav aria-label="Filtrer les produits par collection" className="capsule-rail -mx-4 mb-7 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:mb-9 md:flex-wrap md:px-0">
        <Link to="/boutique" aria-current={!activeCategory ? 'page' : undefined} className={`shrink-0 border px-4 py-2.5 text-xs font-medium transition-colors ${!activeCategory ? 'border-theme-ink bg-theme-ink text-white' : 'border-theme-ink/20 hover:border-theme-ink'}`}>Tout voir</Link>
        {categoriesLoading ? <span className="px-3 py-2.5 text-xs text-theme-ink/60">Chargement des collections…</span> : categories.map((category) => <Link key={category.id} to={`/boutique?categorie=${category.slug}`} aria-current={activeCategory?.id === category.id ? 'page' : undefined} className={`shrink-0 border px-4 py-2.5 text-xs font-medium transition-colors ${activeCategory?.id === category.id ? 'border-theme-ink bg-theme-ink text-white' : 'border-theme-ink/20 hover:border-theme-ink'}`}>{category.name}</Link>)}
      </nav>
      <div className="mb-6 flex items-center justify-between gap-3 border-y border-theme-ink/10 py-4 md:mb-8">
        <p className="text-xs text-theme-ink/65" aria-live="polite">{loading ? 'Chargement…' : `${visibleProducts.length} pièce${visibleProducts.length !== 1 ? 's' : ''}`}{activeCategory ? ` · ${activeCategory.name}` : ''}</p>
        <label className="flex shrink-0 items-center gap-2 text-xs"><span className="hidden text-theme-ink/65 sm:inline">Trier par</span><select aria-label="Trier les produits" value={sort} onChange={(event) => setSort(event.target.value)} className="max-w-[155px] cursor-pointer bg-transparent py-1 text-theme-ink"><option value="selection">Notre sélection</option><option value="newest">Nouveautés</option><option value="price-low">Prix croissant</option><option value="price-high">Prix décroissant</option></select></label>
      </div>
      <ProductGrid products={visibleProducts} loading={loading} error={error} emptyLabel={activeCategory ? `Les pièces ${activeCategory.name} arrivent bientôt.` : undefined} />
    </div>
  );
}
