import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import StorefrontState from '../components/StorefrontState';
import TextReveal from '../components/TextReveal';
import { useProducts } from '../hooks/useProducts';
import { formatMoney, productImage, productPrice } from '../lib/commerce';

export default function Journal() {
  const { products, loading, error } = useProducts();
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 pb-24 pt-32 md:px-12 md:pb-32 md:pt-48">
      <Seo title="Journal & guides produits | STRUKTUR Grenoble" description="Guides d’achat, détails, tailles et réponses utiles sur chaque pièce sélectionnée par STRUKTUR Grenoble." path="/journal" />
      <header className="mb-16 max-w-3xl md:mb-24"><p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-struktur-orange">Conseils & sélection</p><TextReveal text="Journal" className="text-5xl font-display md:text-8xl" /><p className="mt-6 text-lg font-light leading-relaxed text-theme-ink/65">Un guide clair pour chaque pièce : détails du catalogue, options disponibles, prix et réponses aux questions d’achat.</p></header>
      {loading ? <div className="grid gap-10 md:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="aspect-[3/2] animate-pulse bg-theme-surface" />)}</div> : products.length > 0 ? <div className="grid gap-x-10 gap-y-16 md:grid-cols-2">{products.map((product) => <article key={product.id} className="group border-b border-theme-ink/10 pb-10"><Link to={`/journal/${product.slug}`}><div className="mb-6 aspect-[16/10] overflow-hidden bg-theme-surface">{productImage(product) && <img src={productImage(product)!} alt={product.images[0]?.altText || product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}</div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-struktur-orange">Guide produit · {product.brand || 'STRUKTUR'}</p><h2 className="mt-3 font-display text-3xl leading-tight transition-colors group-hover:text-struktur-orange">Tout savoir sur {product.name}</h2><p className="mt-4 line-clamp-2 text-sm font-light leading-relaxed text-theme-ink/60">{product.description || `Présentation, variantes et disponibilité de ${product.name}.`}</p><p className="mt-5 text-xs uppercase tracking-[0.16em]">À partir de {formatMoney(productPrice(product), product.currency)}</p></Link></article>)}</div> : <StorefrontState error={error} />}
    </div>
  );
}
