import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Seo from '../components/Seo';
import StorefrontState from '../components/StorefrontState';
import TextReveal from '../components/TextReveal';
import { useCategories, useProducts } from '../hooks/useProducts';
import { breadcrumbJsonLd } from '../lib/productSeo';
import { SITE_URL } from '../lib/site';

export default function CategoryPage() {
  const { slug } = useParams();
  const { categories, loading: categoriesLoading } = useCategories();
  const { products: sourceProducts, loading: productsLoading, error } = useProducts();
  const category = categories.find((item) => item.slug === slug) ?? null;
  const products = category ? sourceProducts.filter((product) => product.category?.id === category.id) : [];
  const loading = categoriesLoading || productsLoading;

  if (!loading && !category) {
    return <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"><Seo title="Catégorie introuvable | STRUKTUR" description="Cette catégorie n’est pas disponible." path={`/categorie/${slug || ''}`} noIndex /><h1 className="font-display text-4xl">Catégorie introuvable</h1><Link to="/boutique" className="mt-8 border-b border-struktur-orange pb-1 text-xs uppercase tracking-widest text-struktur-orange">Retour à la boutique</Link></div>;
  }

  const title = category ? `${category.name} | STRUKTUR Grenoble` : 'Collection | STRUKTUR Grenoble';
  const description = category?.description || `Découvrez la sélection ${category?.name || ''} disponible chez STRUKTUR Grenoble.`;

  return (
    <div className="min-h-screen pb-24 pt-32 md:pb-32 md:pt-44">
      {category && <Seo title={title} description={description} path={`/categorie/${category.slug}`} image={category.imageUrl} jsonLd={breadcrumbJsonLd([{ name: 'Accueil', url: SITE_URL }, { name: 'Boutique', url: `${SITE_URL}/boutique` }, { name: category.name, url: `${SITE_URL}/categorie/${category.slug}` }])} />}
      <header className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-2 md:px-12">
        <div className="flex flex-col justify-end"><p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-struktur-orange">Collection</p><TextReveal text={category?.name || 'Chargement'} className="text-5xl font-display md:text-7xl" />{description && <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-theme-ink/65">{description}</p>}</div>
        {category?.imageUrl && <div className="aspect-[4/3] overflow-hidden bg-theme-surface"><img src={category.imageUrl} alt={`Collection ${category.name} chez STRUKTUR Grenoble`} className="h-full w-full object-cover" /></div>}
      </header>
      <section className="mx-auto max-w-7xl px-6 pt-20 md:px-12 md:pt-28">
        <div className="mb-12 flex items-end justify-between border-b border-theme-ink/10 pb-5"><p className="text-xs uppercase tracking-[0.2em] text-theme-ink/50">{loading ? 'Chargement' : `${products.length} pièce${products.length > 1 ? 's' : ''}`}</p><Link to="/boutique" className="text-xs uppercase tracking-[0.18em] hover:text-struktur-orange">Toutes les collections</Link></div>
        {loading ? <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="aspect-[4/5] animate-pulse bg-theme-surface" />)}</div> : products.length > 0 ? <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <StorefrontState error={error || 'Aucun produit actif dans cette catégorie.'} />}
      </section>
    </div>
  );
}
