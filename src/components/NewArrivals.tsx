import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from './ProductCard';
import StorefrontState from './StorefrontState';
import TextReveal from './TextReveal';

const NewArrivals = () => {
  const { products, loading, error } = useProducts({ featured: true, limit: 3 });

  return (
    <section className="mx-auto max-w-7xl overflow-hidden px-6 py-16 md:px-12 md:py-32">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 md:mb-16 md:flex-row md:items-end md:gap-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-struktur-orange">Just dropped</p>
          <TextReveal text="Nouveautés" className="mb-3 text-4xl font-display tracking-tight md:mb-4 md:text-6xl" />
          <TextReveal text="Notre dernière sélection en ligne." className="text-base font-light text-theme-ink/70 md:text-lg" delay={0.15} />
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} className="hidden md:block">
          <Link to="/boutique" className="border-b border-theme-ink/20 pb-1 text-xs uppercase tracking-[0.2em] text-theme-ink/50 transition-all hover:border-theme-ink hover:text-theme-ink">Voir toute la sélection</Link>
        </motion.div>
      </div>
      {loading ? <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="aspect-[4/5] animate-pulse bg-theme-surface" />)}</div> : products.length > 0 ? <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <StorefrontState error={error} emptyLabel="Les prochaines pièces arrivent bientôt." />}
      <div className="mt-12 text-center md:hidden"><Link to="/boutique" className="inline-block border-b border-theme-ink/20 pb-1 text-xs uppercase tracking-[0.2em] text-theme-ink/50 transition-all hover:text-theme-ink">Voir toute la sélection</Link></div>
    </section>
  );
};

export default NewArrivals;
