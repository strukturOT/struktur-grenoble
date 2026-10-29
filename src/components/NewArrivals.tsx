import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from './ProductGrid';

const NewArrivals = () => {
  const { products, loading, error } = useProducts({ limit: 8, poolSize: 48, order: 'mixed' });

  return (
    <section aria-labelledby="home-selection-title" className="mx-auto max-w-[1600px] px-4 pb-16 pt-3 md:px-10 md:pb-24 lg:px-14">
      <div className="mb-7 flex items-end justify-between gap-5 md:mb-10">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-theme-ink/60">En ce moment</p>
          <h2 id="home-selection-title" className="font-display text-3xl font-medium md:text-5xl">La sélection.</h2>
        </div>
        <Link to="/nouveautes" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-xs font-medium transition-colors hover:text-struktur-orange">Les nouveautés <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
      <ProductGrid products={products} loading={loading} error={error} emptyLabel="Les prochaines pièces arrivent bientôt." />
      <div className="mt-10 text-center md:mt-14"><Link to="/boutique" className="inline-flex min-h-12 items-center gap-8 border border-theme-ink/30 px-7 py-3 text-sm font-medium transition-colors hover:bg-theme-ink hover:text-white">Toute la boutique <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
    </section>
  );
};

export default NewArrivals;
