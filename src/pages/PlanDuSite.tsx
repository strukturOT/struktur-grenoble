import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useCategories, useProducts } from '../hooks/useProducts';
import { SITE_URL } from '../lib/site';
import { breadcrumbJsonLd } from '../lib/productSeo';

const mainPages = [
  { path: '/', name: 'Accueil' }, { path: '/nouveautes', name: 'Nouveautés' },
  { path: '/boutique', name: 'Boutique' }, { path: '/marques', name: 'Marques' },
  { path: '/lookbook', name: 'Lookbook' }, { path: '/le-shop', name: 'Le shop à Grenoble' },
  { path: '/journal', name: 'Journal et guides' },
];
const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });
const searchable = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');

export default function PlanDuSite() {
  const { products, loading, error } = useProducts();
  const { categories } = useCategories();
  const [query, setQuery] = useState('');
  const sortedProducts = useMemo(() => [...products].sort((a, b) => collator.compare(a.name, b.name)), [products]);
  const visibleProducts = useMemo(() => {
    const terms = searchable(query).trim().split(/\s+/).filter(Boolean);
    return sortedProducts.filter((product) => terms.every((term) => searchable(`${product.name} ${product.brand || ''}`).includes(term)));
  }, [query, sortedProducts]);
  const visibleCategories = categories.filter((category) => products.some((product) => product.category?.id === category.id
    || category.slug === 'dickies' && product.brand?.toLocaleLowerCase('fr') === 'dickies'));
  const canonical = `${SITE_URL}/plan-du-site`;

  return <div className="mx-auto min-h-screen max-w-7xl px-6 pb-24 pt-32 md:px-12 md:pt-44">
    {!loading && <Seo title="Plan du site | STRUKTUR Grenoble" description="Retrouvez les pages, les collections et tous les produits publiés dans la boutique STRUKTUR Grenoble." path="/plan-du-site" jsonLd={[
      { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${canonical}#directory`, name: 'Plan du site STRUKTUR Grenoble', url: canonical, mainEntity: { '@type': 'ItemList', numberOfItems: sortedProducts.length, itemListElement: sortedProducts.map((product, index) => ({ '@type': 'ListItem', position: index + 1, name: product.name, url: `${SITE_URL}/produit/${product.slug}` })) } },
      breadcrumbJsonLd([{ name: 'Accueil', url: SITE_URL }, { name: 'Plan du site', url: canonical }]),
    ]} />}
    <header className="mb-12 max-w-3xl"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-struktur-orange">Explorer STRUKTUR</p><h1 className="font-display text-5xl leading-tight md:text-7xl">Plan du site</h1><p className="mt-5 text-base font-light leading-7 text-theme-ink/65">Retrouvez les pages principales, les collections et toutes les pièces publiées dans notre boutique.</p></header>
    <div className="grid gap-10 border-y border-theme-ink/10 py-10 md:grid-cols-2">
      <nav aria-labelledby="site-main-pages"><h2 id="site-main-pages" className="font-display text-2xl">Pages principales</h2><ul className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2">{mainPages.map((page) => <li key={page.path}><Link to={page.path} className="inline-flex min-h-11 items-center text-sm underline-offset-4 hover:text-struktur-orange hover:underline">{page.name}</Link></li>)}</ul></nav>
      <nav aria-labelledby="site-collections"><h2 id="site-collections" className="font-display text-2xl">Collections</h2><ul className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2">{visibleCategories.map((category) => <li key={category.id}><Link to={`/categorie/${category.slug}`} className="inline-flex min-h-11 items-center text-sm underline-offset-4 hover:text-struktur-orange hover:underline">{category.name}</Link></li>)}</ul></nav>
    </div>
    <section aria-labelledby="site-products" className="pt-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h2 id="site-products" className="font-display text-3xl">Tous les produits</h2><p aria-live="polite" className="mt-3 text-sm text-theme-ink/60">{loading ? 'Chargement du catalogue…' : `${visibleProducts.length} produit${visibleProducts.length !== 1 ? 's' : ''} sur ${sortedProducts.length}`}</p></div><label className="block w-full text-xs text-theme-ink/65 sm:max-w-sm">Rechercher un produit<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom ou marque" className="mt-2 w-full border border-theme-ink/20 bg-transparent px-4 py-3 text-base text-theme-ink outline-none focus:border-struktur-orange" /></label></div>
      {error ? <p role="alert" className="mt-8 border border-struktur-orange/30 p-5 text-sm">Le catalogue est momentanément indisponible. Merci de réessayer dans quelques instants.</p> : <ul className="mt-8 grid gap-x-10 border-t border-theme-ink/10 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map((product) => <li key={product.id} className="min-w-0 border-b border-theme-ink/10 py-4"><Link to={`/produit/${product.slug}`} className="block break-words text-sm leading-6 hover:text-struktur-orange"><span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-theme-ink/50">{product.brand || 'STRUKTUR'}</span>{product.name}</Link></li>)}</ul>}
      {!loading && !error && visibleProducts.length === 0 && <p className="mt-6 text-sm text-theme-ink/65">{query ? 'Aucun produit ne correspond à cette recherche.' : 'La sélection sera prochainement complétée.'}</p>}
    </section>
  </div>;
}
