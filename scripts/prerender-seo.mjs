import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const indexHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
let catalog = { siteUrl: 'https://struktur-grenoble.fr', products: [], categories: [] };
try {
  catalog = JSON.parse(await readFile(path.join(root, '.seo', 'catalog.json'), 'utf8'));
} catch {
  console.warn('[seo] No catalogue snapshot found for route prerendering.');
}
const siteUrl = catalog.siteUrl.replace(/\/$/, '');

const html = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const text = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
const descriptionFor = (product) => {
  const seoDescription = text(product.seo_description);
  if (seoDescription) return seoDescription.length > 160 ? `${seoDescription.slice(0, 157).trimEnd()}…` : seoDescription;
  const description = text(product.description);
  if (description) return description.length > 155 ? `${description.slice(0, 152).trimEnd()}…` : description;
  return `${product.name}${product.brand ? ` par ${product.brand}` : ''}, disponible chez STRUKTUR Grenoble.`;
};
const answersFor = (product) => {
  const variants = product.product_variants || [];
  const available = variants.filter((variant) => variant.stock_quantity > 0);
  const named = variants.map((variant) => variant.name).filter(Boolean);
  const lowestPrice = Math.min(product.price_cents, ...variants.map((variant) => variant.price_cents ?? product.price_cents));
  const formattedPrice = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: product.currency }).format(lowestPrice / 100);
  return [
    { question: `Quel est le prix de ${product.name} ?`, answer: `${product.name} est proposé à partir de ${formattedPrice}. Le prix affiché sur la fiche produit est mis à jour depuis le catalogue STRUKTUR.` },
    { question: `Quelles variantes de ${product.name} sont disponibles ?`, answer: named.length ? `Les variantes proposées sont : ${named.join(', ')}. ${available.length ? `Actuellement en stock : ${available.map((variant) => variant.name).filter(Boolean).join(', ') || `${available.length} option(s)`}.` : 'Aucune de ces variantes n’est actuellement en stock.'} La fiche produit indique le stock par option.` : 'Les options actuellement proposées sont affichées directement sur la fiche produit, avec leur disponibilité en temps réel.' },
    { question: `${product.name} est-il en stock ?`, answer: available.length ? `${available.length} variante${available.length > 1 ? 's sont' : ' est'} actuellement indiquée${available.length > 1 ? 's' : ''} comme disponible. Le stock peut évoluer : vérifiez la sélection de taille avant l’ajout au panier.` : 'Aucune variante n’est actuellement indiquée comme disponible. La fiche sera automatiquement mise à jour lors du prochain réassort.' },
    { question: `Où découvrir ${product.name} ?`, answer: 'Retrouvez cette pièce dans la sélection en ligne STRUKTUR et au concept store, 45 rue Lesdiguières à Grenoble.' },
  ];
};

function applyHead(source, { title, description, canonical, image, type = 'website', jsonLd }) {
  let output = source
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${html(title)}</title>`)
    .replace(/<meta name="description"[\s\S]*?>/i, `<meta name="description" content="${html(description)}" />`)
    .replace(/<meta property="og:title"[\s\S]*?>/i, `<meta property="og:title" content="${html(title)}" />`)
    .replace(/<meta property="og:description"[\s\S]*?>/i, `<meta property="og:description" content="${html(description)}" />`)
    .replace(/<meta property="og:image"[\s\S]*?>/i, `<meta property="og:image" content="${html(image || `${siteUrl}/brand/og-image.webp`)}" />`)
    .replace(/<meta property="og:url"[\s\S]*?>/i, `<meta property="og:url" content="${html(canonical)}" />`)
    .replace(/<meta property="og:type"[\s\S]*?>/i, `<meta property="og:type" content="${type}" />`)
    .replace(/<meta name="twitter:title"[\s\S]*?>/i, `<meta name="twitter:title" content="${html(title)}" />`)
    .replace(/<meta name="twitter:description"[\s\S]*?>/i, `<meta name="twitter:description" content="${html(description)}" />`)
    .replace(/<meta name="twitter:image"[\s\S]*?>/i, `<meta name="twitter:image" content="${html(image || `${siteUrl}/brand/og-image.webp`)}" />`);
  output = output
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, '')
    .replace(/<link rel="canonical"[^>]*>/i, '')
    .replace('</head>', `  <link rel="canonical" href="${html(canonical)}" />\n  <script id="struktur-page-jsonld" type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>\n</head>`);
  return output;
}

async function writeRoute(route, metadata, fallbackMarkup) {
  const relative = route.replace(/^\//, '');
  if (!relative || relative.includes('..')) return;
  const outputPath = path.join(distDir, `${relative}.html`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  let output = applyHead(indexHtml, metadata);
  output = output.replace('<div id="root"></div>', `<div id="root">${fallbackMarkup}</div>`);
  await writeFile(outputPath, output);
}

const breadcrumb = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })) });

const staticPages = [
  { route: '/nouveautes', title: 'Nouveautés streetwear & sneakers | STRUKTUR Grenoble', description: 'Découvrez les dernières pièces streetwear, sneakers et accessoires disponibles chez STRUKTUR Grenoble.', heading: 'Nouveautés', copy: 'La sélection du moment, mise à jour depuis le catalogue STRUKTUR.' },
  { route: '/boutique', title: 'Boutique streetwear & sneakers | STRUKTUR Grenoble', description: 'Achetez la sélection STRUKTUR : vêtements, sneakers et accessoires de marques indépendantes, avec stock affiché en direct.', heading: 'Boutique', copy: 'Vêtements, sneakers et accessoires sélectionnés par STRUKTUR Grenoble.' },
  { route: '/marques', title: 'Marques streetwear sélectionnées | STRUKTUR Grenoble', description: 'Explorez les marques streetwear, outdoor et lifestyle sélectionnées par STRUKTUR au cœur de Grenoble.', heading: 'Marques', copy: 'Une sélection indépendante de marques streetwear et lifestyle.' },
  { route: '/lookbook', title: 'Lookbook streetwear Grenoble | STRUKTUR', description: 'Silhouettes, matières et culture urbaine : le lookbook éditorial de STRUKTUR Grenoble.', heading: 'Lookbook', copy: 'Les silhouettes et l’univers éditorial de STRUKTUR Grenoble.' },
  { route: '/le-shop', title: 'Le shop STRUKTUR | 45 rue Lesdiguières, Grenoble', description: 'Découvrez STRUKTUR, concept store indépendant au 45 rue Lesdiguières à Grenoble : adresse, horaires et univers.', heading: 'Le shop', copy: 'STRUKTUR vous accueille au 45 rue Lesdiguières, 38000 Grenoble.' },
  { route: '/journal', title: 'Journal & guides produits | STRUKTUR Grenoble', description: 'Guides d’achat, détails, tailles et réponses utiles sur chaque pièce sélectionnée par STRUKTUR Grenoble.', heading: 'Journal', copy: 'Guides factuels pour découvrir les pièces du catalogue STRUKTUR.' },
];

for (const page of staticPages) {
  const canonical = `${siteUrl}${page.route}`;
  const links = page.route === '/journal'
    ? catalog.products.map((product) => `<li><a href="/journal/${html(product.slug)}">Guide ${html(product.name)}</a></li>`).join('')
   : page.route === '/boutique'
      ? [
          ...catalog.categories.map((category) => `<li><a href="/categorie/${html(category.slug)}">${html(category.name)}</a></li>`),
          ...catalog.products.map((product) => `<li><a href="/produit/${html(product.slug)}">${html(product.name)}</a></li>`),
        ].join('')
      : '';
  const fallback = `<main style="padding:8rem 2rem;max-width:900px;margin:auto"><h1>${html(page.heading)}</h1><p>${html(page.copy)}</p>${links ? `<ul>${links}</ul>` : ''}</main>`;
  await writeRoute(page.route, { title: page.title, description: page.description, canonical, jsonLd: breadcrumb([{ name: 'Accueil', url: siteUrl }, { name: page.heading, url: canonical }]) }, fallback);
}

for (const product of catalog.products) {
  const canonical = `${siteUrl}/produit/${product.slug}`;
  const image = product.product_images?.[0]?.image_url || `${siteUrl}/brand/og-image.webp`;
  const description = descriptionFor(product);
  const answers = answersFor(product);
  const offers = (product.product_variants?.length ? product.product_variants : [{ price_cents: product.price_cents, stock_quantity: 0 }]).map((variant) => ({ '@type': 'Offer', url: canonical, sku: variant.sku, priceCurrency: product.currency, price: ((variant.price_cents ?? product.price_cents) / 100).toFixed(2), availability: variant.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition', seller: { '@type': 'Organization', name: 'STRUKTUR Grenoble' } }));
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: answers.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) };
  const schema = [{ '@context': 'https://schema.org', '@type': 'Product', '@id': `${canonical}#product`, name: product.name, description, image: product.product_images.map((item) => item.image_url), sku: product.product_variants?.[0]?.sku, brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined, category: product.categories?.name, offers }, faqSchema, breadcrumb([{ name: 'Accueil', url: siteUrl }, { name: 'Boutique', url: `${siteUrl}/boutique` }, { name: product.name, url: canonical }])];
  const fallback = `<main style="padding:8rem 2rem;max-width:900px;margin:auto"><article><p>${html(product.brand || 'STRUKTUR')}</p><h1>${html(product.name)}</h1><p>${html(description)}</p><p>${html((product.price_cents / 100).toFixed(2))} ${html(product.currency)}</p><h2>Questions fréquentes</h2>${answers.map((item) => `<h3>${html(item.question)}</h3><p>${html(item.answer)}</p>`).join('')}<a href="/boutique">Retour à la boutique</a></article></main>`;
  await writeRoute(`/produit/${product.slug}`, { title: text(product.seo_title) || `${product.name}${product.brand ? ` par ${product.brand}` : ''} | STRUKTUR`, description, canonical, image, type: 'product', jsonLd: schema }, fallback);

  const articleCanonical = `${siteUrl}/journal/${product.slug}`;
  const articleSchema = [{ '@context': 'https://schema.org', '@type': 'Article', '@id': `${articleCanonical}#article`, headline: `Tout savoir sur ${product.name}`, description, image: product.product_images.map((item) => item.image_url), mainEntityOfPage: articleCanonical, author: { '@type': 'Organization', name: 'STRUKTUR Grenoble', url: siteUrl }, publisher: { '@type': 'Organization', name: 'STRUKTUR Grenoble' }, datePublished: product.created_at, dateModified: product.updated_at, inLanguage: 'fr-FR' }, breadcrumb([{ name: 'Accueil', url: siteUrl }, { name: 'Journal', url: `${siteUrl}/journal` }, { name: product.name, url: articleCanonical }])];
  const articleFallback = `<main style="padding:8rem 2rem;max-width:900px;margin:auto"><article><p>Guide produit · ${html(product.brand || 'STRUKTUR')}</p><h1>Tout savoir sur ${html(product.name)}</h1><p>${html(description)}</p><h2>Variantes et disponibilité</h2><p>Les prix, options et stocks sont mis à jour depuis le catalogue STRUKTUR.</p><h2>Questions fréquentes</h2>${answers.map((item) => `<h3>${html(item.question)}</h3><p>${html(item.answer)}</p>`).join('')}<a href="/produit/${html(product.slug)}">Voir la fiche produit</a></article></main>`;
  await writeRoute(`/journal/${product.slug}`, { title: `Guide ${product.name} | STRUKTUR Grenoble`, description, canonical: articleCanonical, image, type: 'article', jsonLd: articleSchema }, articleFallback);
}

for (const category of catalog.categories) {
  const canonical = `${siteUrl}/categorie/${category.slug}`;
  const description = text(category.description) || `Découvrez la sélection ${category.name} disponible chez STRUKTUR Grenoble.`;
  const products = catalog.products.filter((product) => product.categories?.slug === category.slug);
  const schema = [
    breadcrumb([{ name: 'Accueil', url: siteUrl }, { name: 'Boutique', url: `${siteUrl}/boutique` }, { name: category.name, url: canonical }]),
    { '@context': 'https://schema.org', '@type': 'ItemList', name: category.name, numberOfItems: products.length, itemListElement: products.map((product, index) => ({ '@type': 'ListItem', position: index + 1, url: `${siteUrl}/produit/${product.slug}`, name: product.name })) },
  ];
  const categoryProducts = products.map((product) => `<li><a href="/produit/${html(product.slug)}">${html(product.name)}</a></li>`).join('');
  const fallback = `<main style="padding:8rem 2rem;max-width:900px;margin:auto"><h1>${html(category.name)}</h1><p>${html(description)}</p><h2>Produits de la collection</h2><ul>${categoryProducts || '<li>Consultez la boutique pour découvrir la sélection à venir.</li>'}</ul><a href="/boutique">Toutes les collections</a></main>`;
  await writeRoute(`/categorie/${category.slug}`, { title: `${category.name} | STRUKTUR Grenoble`, description, canonical, image: category.image_url, jsonLd: schema }, fallback);
}

const homeCanonical = siteUrl;
const homeSchema = [{
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  '@id': homeCanonical + '/#store',
  name: 'STRUKTUR Grenoble',
  url: homeCanonical,
  image: homeCanonical + '/brand/og-image.webp',
  telephone: '+33786380736',
  address: { '@type': 'PostalAddress', streetAddress: '45 Rue Lesdiguières', postalCode: '38000', addressLocality: 'Grenoble', addressCountry: 'FR' },
  sameAs: ['https://www.instagram.com/struktur.kultur/'],
}, {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': homeCanonical + '/#website',
  name: 'STRUKTUR Grenoble',
  url: homeCanonical,
  inLanguage: 'fr-FR',
}];
const homeLinks = catalog.categories.map((category) => '<li><a href="/categorie/' + html(category.slug) + '">' + html(category.name) + '</a></li>').join('');
const homeProducts = catalog.products.map((product) => '<li><a href="/produit/' + html(product.slug) + '">' + html(product.name) + '</a></li>').join('');
const homeFallback = '<main style="padding:8rem 2rem;max-width:1100px;margin:auto"><h1>STRUKTUR Grenoble — concept store streetwear &amp; sneakers</h1><p>Une sélection indépendante de vêtements, sneakers et accessoires au 45 rue Lesdiguières, 38000 Grenoble.</p><nav aria-label="Navigation principale"><a href="/nouveautes">Nouveautés</a> · <a href="/boutique">Boutique</a> · <a href="/marques">Marques</a> · <a href="/lookbook">Lookbook</a> · <a href="/le-shop">Le shop à Grenoble</a> · <a href="/journal">Journal &amp; guides</a></nav><h2>Collections</h2><ul>' + homeLinks + '</ul><h2>Produits du catalogue</h2><ul>' + homeProducts + '</ul></main>';
const homeHtml = applyHead(indexHtml, {
  title: 'STRUKTUR Grenoble | Concept store streetwear & sneakers',
  description: 'STRUKTUR Grenoble sélectionne vêtements streetwear, sneakers et accessoires premium au 45 rue Lesdiguières, Grenoble.',
  canonical: homeCanonical,
  image: homeCanonical + '/brand/og-image.webp',
  jsonLd: homeSchema,
}).replace('<div id="root"></div>', '<div id="root">' + homeFallback + '</div>');
await writeFile(path.join(distDir, 'index.html'), homeHtml);
console.log(`[seo] Prerendered ${1 + staticPages.length + catalog.products.length * 2 + catalog.categories.length} public routes.`);
