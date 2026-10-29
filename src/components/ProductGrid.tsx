import type { StoreProduct } from '../lib/commerce';
import ProductCard from './ProductCard';
import StorefrontState from './StorefrontState';

export default function ProductGrid({ products, loading, error, emptyLabel, skeletonCount = 8 }: {
  products: StoreProduct[];
  loading: boolean;
  error: string | null;
  emptyLabel?: string;
  skeletonCount?: number;
}) {
  const gridClass = 'product-grid grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-12 md:grid-cols-3 xl:grid-cols-4';
  if (loading) {
    return <div className={gridClass} aria-label="Chargement des produits" aria-busy="true">{Array.from({ length: skeletonCount }, (_, index) => <div key={index}><div className="aspect-[4/5] animate-pulse bg-theme-surface motion-reduce:animate-none" /><div className="mt-3 h-3 w-2/3 animate-pulse bg-theme-surface motion-reduce:animate-none" /></div>)}</div>;
  }
  if (!products.length) return <StorefrontState error={error} emptyLabel={emptyLabel} />;
  return <div className={gridClass}>{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>;
}
