import ProductCard from '../components/ProductCard';
import StorefrontState from '../components/StorefrontState';
import TextReveal from '../components/TextReveal';
import { useProducts } from '../hooks/useProducts';

const Nouveautes = () => {
  const { products, loading, error } = useProducts();

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 pb-24 pt-32 md:px-12 md:pb-32 md:pt-48">
      <div className="mb-12 md:mb-20"><TextReveal text="Nouveautés" className="mb-4 text-4xl font-display tracking-tight sm:text-5xl md:text-7xl" /><TextReveal text="La sélection du moment." className="text-lg font-light text-theme-ink/70 md:text-xl" delay={0.15} /></div>
      {loading ? <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="aspect-[4/5] animate-pulse bg-theme-surface" />)}</div> : products.length > 0 ? <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <StorefrontState error={error} />}
    </div>
  );
};

export default Nouveautes;
