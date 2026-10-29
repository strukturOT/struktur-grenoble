import ProductGrid from '../components/ProductGrid';
import TextReveal from '../components/TextReveal';
import { useProducts } from '../hooks/useProducts';

const Nouveautes = () => {
  const { products, loading, error } = useProducts({ order: 'mixed', poolSize: 36 });

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] px-4 pb-20 pt-28 md:px-10 md:pb-28 md:pt-36 lg:px-14">
      <div className="mb-8 md:mb-12"><TextReveal as="h1" text="Nouveautés" className="mb-3 text-4xl font-display font-medium md:text-6xl" /><p className="text-sm text-theme-ink/65 md:text-base">Les dernières pièces arrivées dans la sélection.</p></div>
      <ProductGrid products={products} loading={loading} error={error} />
    </div>
  );
};

export default Nouveautes;
