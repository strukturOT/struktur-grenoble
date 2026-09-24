import { Link, useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import { useProduct } from '../hooks/useProducts';
import { formatMoney, productImage, productPrice } from '../lib/commerce';
import { breadcrumbJsonLd, productAnswers, productSeoDescription } from '../lib/productSeo';
import { SITE_URL } from '../lib/site';

export default function ProductJournal() {
  const { slug } = useParams();
  const { product, loading } = useProduct(slug);
  if (loading) return <div className="mx-auto min-h-screen max-w-4xl px-6 pt-40"><div className="h-80 animate-pulse bg-theme-surface" /></div>;
  if (!product) return <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"><Seo title="Guide introuvable | STRUKTUR" description="Ce guide produit n’est pas disponible." path={`/journal/${slug || ''}`} noIndex /><h1 className="font-display text-4xl">Guide introuvable</h1><Link to="/journal" className="mt-8 border-b border-struktur-orange pb-1 text-xs uppercase tracking-widest text-struktur-orange">Voir le journal</Link></div>;

  const answers = productAnswers(product);
  const canonical = `${SITE_URL}/journal/${product.slug}`;
  const description = productSeoDescription(product);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonical}#article`,
    headline: `Tout savoir sur ${product.name}`,
    description,
    image: product.images.map((image) => image.imageUrl),
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'STRUKTUR Grenoble', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'STRUKTUR Grenoble', logo: { '@type': 'ImageObject', url: `${SITE_URL}/brand/struktur-mark.svg` } },
    datePublished: product.createdAt,
    dateModified: product.updatedAt,
    inLanguage: 'fr-FR',
  };

  return (
    <article className="mx-auto min-h-screen max-w-5xl px-6 pb-24 pt-32 md:px-12 md:pb-32 md:pt-44">
      <Seo title={`Guide ${product.name} | STRUKTUR Grenoble`} description={description} path={`/journal/${product.slug}`} image={productImage(product)} type="article" noIndex={product.slug.toLowerCase().startsWith('test-')} jsonLd={[articleSchema, breadcrumbJsonLd([{ name: 'Accueil', url: SITE_URL }, { name: 'Journal', url: `${SITE_URL}/journal` }, { name: product.name, url: canonical }])]} />
      <nav aria-label="Fil d’Ariane" className="mb-10 text-[10px] uppercase tracking-[0.18em] text-theme-ink/45"><Link to="/journal" className="hover:text-struktur-orange">Journal</Link><span className="mx-3">/</span><span>{product.name}</span></nav>
      <header className="max-w-4xl"><p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-struktur-orange">Guide produit · {product.brand || 'STRUKTUR'}</p><h1 className="font-display text-5xl leading-[1.02] md:text-8xl">Tout savoir sur {product.name}</h1><p className="mt-7 max-w-3xl text-xl font-light leading-relaxed text-theme-ink/65">{description}</p></header>
      {productImage(product) && <figure className="my-14 overflow-hidden bg-theme-surface md:my-20"><img src={productImage(product)!} alt={product.images[0]?.altText || product.name} className="max-h-[820px] w-full object-cover" /><figcaption className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-theme-ink/45">{product.name} · {product.brand || 'Sélection STRUKTUR'}</figcaption></figure>}
      <div className="grid gap-14 md:grid-cols-[1fr_260px] md:gap-20">
        <div className="space-y-14">
          <section><p className="mb-3 text-xs uppercase tracking-[0.2em] text-struktur-orange">La pièce</p><h2 className="font-display text-3xl md:text-4xl">Ce qu’il faut savoir</h2><p className="mt-5 text-base font-light leading-8 text-theme-ink/70">{product.description || `${product.name} fait partie de la sélection actuelle de STRUKTUR Grenoble. Les informations de prix, de variante et de disponibilité ci-dessous viennent directement du catalogue de la boutique.`}</p></section>
          <section><p className="mb-3 text-xs uppercase tracking-[0.2em] text-struktur-orange">Bien choisir</p><h2 className="font-display text-3xl md:text-4xl">Variantes et disponibilité</h2><p className="mt-5 text-base font-light leading-8 text-theme-ink/70">Choisissez uniquement parmi les options actives sur la fiche produit. Le stock est contrôlé par variante : une option barrée est momentanément indisponible. Pour préserver la pièce, suivez toujours les instructions portées sur son étiquette d’entretien.</p></section>
          <section><p className="mb-3 text-xs uppercase tracking-[0.2em] text-struktur-orange">Questions fréquentes</p><h2 className="font-display text-3xl md:text-4xl">Réponses utiles</h2><div className="mt-7 divide-y divide-theme-ink/10 border-y border-theme-ink/10">{answers.map((item) => <details key={item.question} className="group py-5"><summary className="cursor-pointer list-none pr-8 font-display text-xl marker:content-none">{item.question}</summary><p className="mt-4 max-w-2xl text-sm font-light leading-7 text-theme-ink/65">{item.answer}</p></details>)}</div></section>
        </div>
        <aside className="h-fit border border-theme-ink/10 p-6 md:sticky md:top-32"><p className="text-[10px] uppercase tracking-[0.2em] text-theme-ink/45">Prix actuel</p><p className="mt-2 font-display text-3xl">{formatMoney(productPrice(product), product.currency)}</p><p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-theme-ink/45">Catégorie</p><p className="mt-2 text-sm">{product.category?.name || 'Sélection STRUKTUR'}</p><Link to={`/produit/${product.slug}`} className="mt-8 block bg-struktur-orange px-5 py-4 text-center text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-theme-ink">Voir la fiche produit</Link></aside>
      </div>
    </article>
  );
}
