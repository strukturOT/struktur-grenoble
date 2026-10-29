import { Link, useParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import Seo from '../components/Seo';
import TextReveal from '../components/TextReveal';
import { useCategories, useProducts } from '../hooks/useProducts';
import { breadcrumbJsonLd } from '../lib/productSeo';
import { SITE_URL } from '../lib/site';

export default function CategoryPage() {
  const { slug } = useParams();
  const { categories, loading: categoriesLoading } = useCategories();
  const { products: sourceProducts, loading: productsLoading, error } = useProducts({ order: 'mixed' });
  const category = categories.find((item) => item.slug === slug) ?? null;
  const products = category ? sourceProducts.filter((product) => product.category?.id === category.id) : [];
  const loading = categoriesLoading || productsLoading;

  if (!loading && !category) {
    return <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"><Seo title="Catégorie introuvable | STRUKTUR" description="Cette catégorie n’est pas disponible." path={`/categorie/${slug || ''}`} noIndex /><h1 className="font-display text-4xl">Catégorie introuvable</h1><Link to="/boutique" className="mt-8 border-b border-struktur-orange pb-1 text-xs uppercase tracking-widest text-struktur-orange">Retour à la boutique</Link></div>;
  }

  const title = category ? `${category.name} | STRUKTUR Grenoble` : 'Collection | STRUKTUR Grenoble';
  const description = category?.description || `Découvrez la sélection ${category?.name || ''} disponible chez STRUKTUR Grenoble.`;

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] px-4 pb-20 pt-28 md:px-10 md:pb-28 md:pt-36 lg:px-14">
      {category && <Seo title={title} description={description} path={`/categorie/${category.slug}`} image={category.imageUrl} jsonLd={breadcrumbJsonLd([{ name: 'Accueil', url: SITE_URL }, { name: 'Boutique', url: `${SITE_URL}/boutique` }, { name: category.name, url: `${SITE_URL}/categorie/${category.slug}` }])} />}
      <header>
        <Link to="/boutique" className="mb-6 inline-flex min-h-9 items-center text-xs text-theme-ink/60 hover:text-struktur-orange">Boutique / Collection</Link>
        <TextReveal as="h1" text={category?.name || 'Chargement'} className="text-4xl font-display font-medium md:text-6xl" />
        {description && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-theme-ink/65 md:text-base">{description}</p>}
      </header>
      <section className="pt-9 md:pt-12">
        <div className="mb-6 flex items-center justify-between gap-3 border-y border-theme-ink/10 py-4"><p className="text-xs text-theme-ink/65">{loading ? 'Chargement…' : `${products.length} pièce${products.length !== 1 ? 's' : ''}`}</p><Link to="/boutique" className="text-xs hover:text-struktur-orange">Toutes les collections</Link></div>
        <ProductGrid products={products} loading={loading} error={error} emptyLabel="Aucun produit actif dans cette catégorie." />
      </section>
    </div>
  );
}
