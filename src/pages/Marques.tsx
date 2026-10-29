import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useProducts';
import StorefrontState from '../components/StorefrontState';

export default function Marques() {
  const { categories, loading, error } = useCategories();
  return (
    <div className="mx-auto min-h-screen max-w-[1600px] px-4 pb-20 pt-28 md:px-10 md:pb-28 md:pt-36 lg:px-14">
      <header className="mb-9 md:mb-12"><h1 className="font-display text-4xl font-medium md:text-6xl">Marques & collections.</h1><p className="mt-4 max-w-xl text-sm text-theme-ink/65 md:text-base">Les univers de la sélection STRUKTUR. Explorez les pièces de chaque collection.</p></header>
      {loading ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-7" aria-label="Chargement des collections">{Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[4/3] animate-pulse bg-theme-surface motion-reduce:animate-none" />)}</div> : categories.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-7 md:gap-y-12">{categories.map((category) => <Link key={category.id} to={`/categorie/${category.slug}`} className="group min-w-0"><div className="aspect-[4/3] overflow-hidden bg-white">{category.imageUrl && <img src={category.imageUrl} alt={`La collection ${category.name} chez STRUKTUR`} loading="lazy" className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.025] motion-reduce:transform-none" />}</div><div className="flex items-start justify-between gap-2 pt-4"><div><h2 className="font-display text-xl font-medium md:text-3xl">{category.name}</h2><p className="mt-1 text-xs text-theme-ink/65">{category.productCount} pièce{category.productCount !== 1 ? 's' : ''}</p></div><ArrowUpRight size={19} className="mt-1 shrink-0" aria-hidden="true" /></div></Link>)}</div> : <StorefrontState error={error} emptyLabel="Les collections arrivent bientôt." />}
    </div>
  );
}
