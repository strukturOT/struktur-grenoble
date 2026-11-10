import { Link, useParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import Seo from '../components/Seo';
import TextReveal from '../components/TextReveal';
import { useCategories, useProducts } from '../hooks/useProducts';
import { breadcrumbJsonLd } from '../lib/productSeo';
import { SITE_URL } from '../lib/site';
import { collectionContent } from '../data/collectionContent';

export default function CategoryPage() {
  const { slug } = useParams();
  const { categories, loading: categoriesLoading } = useCategories();
  const { products: sourceProducts, loading: productsLoading, error } = useProducts({ order: 'mixed' });
  const category = categories.find((item) => item.slug === slug) ?? null;
  const products = category ? sourceProducts.filter((product) => product.category?.id === category.id
    || (category.slug === 'dickies' && product.brand?.toLocaleLowerCase('fr') === 'dickies')) : [];
  const loading = categoriesLoading || productsLoading;

  if (!loading && !category) {
    return <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"><Seo title="Catégorie introuvable | STRUKTUR" description="Cette catégorie n’est pas disponible." path={`/categorie/${slug || ''}`} noIndex /><h1 className="font-display text-4xl">Catégorie introuvable</h1><Link to="/boutique" className="mt-8 border-b border-struktur-orange pb-1 text-xs uppercase tracking-widest text-struktur-orange">Retour à la boutique</Link></div>;
  }

  const content = category ? collectionContent[category.slug] : undefined;
  const title = content?.title || (category ? `${category.name} | STRUKTUR Grenoble` : 'Collection | STRUKTUR Grenoble');
  const description = content?.description || category?.description || `Découvrez la sélection ${category?.name || ''} disponible chez STRUKTUR Grenoble.`;
  const relatedCategories = (content?.relatedSlugs || []).map((relatedSlug) => categories.find((item) => item.slug === relatedSlug)).filter((item) => Boolean(item));

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] px-4 pb-20 pt-28 md:px-10 md:pb-28 md:pt-36 lg:px-14">
      {category && <Seo title={title} description={description} path={`/categorie/${category.slug}`} image={category.imageUrl} jsonLd={[
        breadcrumbJsonLd([{ name: 'Accueil', url: SITE_URL }, { name: 'Boutique', url: `${SITE_URL}/boutique` }, { name: category.name, url: `${SITE_URL}/categorie/${category.slug}` }]),
        { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${SITE_URL}/categorie/${category.slug}#collection`, url: `${SITE_URL}/categorie/${category.slug}`, name: title, description, mainEntity: { '@type': 'ItemList', name: category.name, numberOfItems: products.length, itemListElement: products.map((product, index) => ({ '@type': 'ListItem', position: index + 1, name: product.name, url: `${SITE_URL}/produit/${product.slug}` })) } },
      ]} />}
      <header>
        <nav aria-label="Fil d’Ariane" className="mb-6 flex min-h-9 flex-wrap items-center gap-2 text-xs text-theme-ink/60"><Link to="/" className="hover:text-struktur-orange">Accueil</Link><span aria-hidden="true">/</span><Link to="/boutique" className="hover:text-struktur-orange">Boutique</Link><span aria-hidden="true">/</span><span aria-current="page">{category?.name || 'Collection'}</span></nav>
        <TextReveal as="h1" text={category?.name || 'Chargement'} className="text-4xl font-display font-medium md:text-6xl" />
        {(category?.description || content?.intro || description) && <p className="mt-4 max-w-3xl text-sm leading-7 text-theme-ink/65 md:text-base">{category?.description || content?.intro || description}</p>}
      </header>
      <section className="pt-9 md:pt-12">
        <div className="mb-6 flex items-center justify-between gap-3 border-y border-theme-ink/10 py-4"><p className="text-xs text-theme-ink/65">{loading ? 'Chargement…' : `${products.length} pièce${products.length !== 1 ? 's' : ''}`}</p><Link to="/boutique" className="text-xs hover:text-struktur-orange">Toutes les collections</Link></div>
        <ProductGrid products={products} loading={loading} error={error} emptyLabel="Aucun produit actif dans cette catégorie." />
      </section>
      {category && <section aria-labelledby="collection-guide-title" className="mt-16 grid gap-8 border-t border-theme-ink/10 pt-10 md:mt-24 md:grid-cols-2 md:gap-16">
        <div><h2 id="collection-guide-title" className="font-display text-2xl md:text-3xl">Votre sélection {category.name} à Grenoble</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-theme-ink/65">{content?.detail || description}</p><Link to="/le-shop" className="mt-4 inline-flex min-h-11 items-center text-sm underline underline-offset-4 hover:text-struktur-orange">Découvrir la boutique et contacter l’équipe</Link></div>
        {relatedCategories.length > 0 && <nav aria-label="Autres collections"><h2 className="font-display text-2xl md:text-3xl">À découvrir aussi</h2><div className="mt-5 divide-y divide-theme-ink/10 border-y border-theme-ink/10">{relatedCategories.map((related) => related && <Link key={related.id} to={`/categorie/${related.slug}`} className="flex min-h-14 items-center justify-between py-3 text-sm hover:text-struktur-orange"><span>{related.name}</span><span aria-hidden="true">↗</span></Link>)}</div></nav>}
      </section>}
    </div>
  );
}
