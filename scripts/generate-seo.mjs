import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { catalogPriceCents } from './catalog-price.mjs';
import { loadEnv } from 'vite';
import { resolveSiteConfig } from './site-origin.mjs';
import { PRIVATE_ROUTES, latestModified, productModified } from './seo-utils.mjs';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const cacheDir = path.join(root, '.seo');
const cachePath = path.join(cacheDir, 'catalog.json');
const collectionContent = JSON.parse(await readFile(path.join(root, 'scripts/data/collection-content.json'), 'utf8'));

const modeFlag = process.argv.indexOf('--mode');
const mode = modeFlag >= 0 ? process.argv[modeFlag + 1]
  : process.env.npm_lifecycle_event === 'predev' || process.env.NODE_ENV === 'development' ? 'development' : 'production';
const env = { ...loadEnv(mode, root, 'VITE_'), ...process.env };
const { siteOrigin: siteUrl, isIndexable } = resolveSiteConfig(env);
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const today = new Date().toISOString();

const xml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const markdown = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
const absolute = (route = '/') => `${siteUrl}${route === '/' ? '' : route}`;
const iso = (value) => {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
};
const absoluteImageUrl = (value) => {
  try {
    const url = new URL(value, `${siteUrl}/`);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
};

async function fetchRows(table, select, order, filters = {}) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('[seo] VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required to create a catalogue sitemap.');
  }
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const params = new URLSearchParams({ select, order, limit: String(pageSize), offset: String(offset), ...filters });
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${params}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!response.ok) throw new Error(`Supabase ${table} request failed (${response.status}): ${await response.text()}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function fetchCatalog() {
  const select = 'id,name,slug,brand,description,seo_title,seo_description,price_cents,currency,status,featured,created_at,updated_at,categories(id,name,slug,description,image_url),product_images(image_url,alt_text,position,created_at),product_variants(id,name,sku,price_cents,stock_quantity,position,attributes,updated_at)';
  return fetchRows('products', select, 'updated_at.desc', { status: 'eq.active' });
}

let products;
let categories;
try {
  [products, categories] = await Promise.all([
    fetchCatalog(),
    fetchRows('categories', 'id,name,slug,description,image_url,updated_at,position', 'position.asc,name.asc'),
  ]);
} catch (error) {
  // Publishing stale availability/price markup after a failed fetch is worse
  // than failing the build. A saved catalogue is only a development fallback.
  if (env.CI || env.CF_PAGES || mode === 'production') throw error;
  console.warn(`[seo] ${error.message}`);
  try {
    const snapshot = JSON.parse(await readFile(cachePath, 'utf8'));
    products = snapshot.products || [];
    categories = snapshot.categories || [];
    console.warn('[seo] Using the last local catalogue snapshot.');
  } catch {
    products = [];
    categories = [];
    console.warn('[seo] No catalogue credentials or snapshot found; generating static SEO files only.');
  }
}

products = products.map((product) => ({
  ...product,
  product_images: [...(product.product_images || [])].sort((a, b) => a.position - b.position),
  product_variants: [...(product.product_variants || [])].sort((a, b) => a.position - b.position),
})).filter((product) => !product.slug.toLowerCase().startsWith('test-'));
if (!products.length && (env.CI || env.CF_PAGES)) throw new Error('[seo] Refusing to publish an unexpectedly empty catalogue.');

const productCounts = new Map();
for (const product of products) {
  const slug = product.categories?.slug;
  if (slug) productCounts.set(slug, (productCounts.get(slug) || 0) + 1);
}
productCounts.set('dickies', products.filter((product) => product.brand?.toLocaleLowerCase('fr') === 'dickies').length);
categories = categories
  .map((category) => ({ ...category, content: collectionContent[category.slug], product_count: productCounts.get(category.slug) || 0 }))
  .filter((category) => category.product_count > 0);

await mkdir(publicDir, { recursive: true });
await mkdir(cacheDir, { recursive: true });
await writeFile(cachePath, `${JSON.stringify({ generatedAt: today, siteUrl, isIndexable, products, categories }, null, 2)}\n`);
// Pages Functions need the same public configuration as the browser bundle.
// Explicitly whitelist publishable/anon credentials; never serialize process.env.
let isPublicKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(supabaseKey || '');
if (!isPublicKey && supabaseKey?.split('.').length === 3) {
  try { isPublicKey = JSON.parse(Buffer.from(supabaseKey.split('.')[1], 'base64url').toString()).role === 'anon'; } catch { /* invalid key */ }
}
if (!isPublicKey) throw new Error('[seo] The Pages public catalogue configuration requires a publishable or anon key.');
const supabaseOrigin = new URL(supabaseUrl);
if (supabaseOrigin.protocol !== 'https:' || supabaseOrigin.username || supabaseOrigin.password || supabaseOrigin.pathname !== '/' || supabaseOrigin.search || supabaseOrigin.hash) throw new Error('[seo] Invalid public Supabase origin.');
const redirectText = await readFile(path.join(publicDir, '_redirects'), 'utf8');
const productRedirects = Object.fromEntries(redirectText.split('\n').map((line) => line.trim().split(/\s+/)).filter(([from, to, code]) => code === '301' && /^\/produit\/[a-z0-9-]+$/.test(from) && /^\/produit\/[a-z0-9-]+$/.test(to)).map(([from, to]) => [from, to]));
await writeFile(path.join(cacheDir, 'public-config.json'), `${JSON.stringify({ siteUrl, isIndexable, supabaseUrl: supabaseOrigin.origin, supabaseKey, productRedirects }, null, 2)}\n`);

const urlSet = (entries, imageAware = false) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${imageAware ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''}>
${entries.join('\n')}
</urlset>
`;

const urlEntry = ({ loc, lastmod, images = [] }) => `  <url>
    <loc>${xml(loc)}</loc>
    ${iso(lastmod) ? `<lastmod>${xml(iso(lastmod))}</lastmod>` : ''}${images.filter((image) => absoluteImageUrl(image.url)).map((image) => `
    <image:image>
      <image:loc>${xml(absoluteImageUrl(image.url))}</image:loc>
    </image:image>`).join('')}
  </url>`;

const staticRoutes = ['/', '/nouveautes', '/boutique', '/marques', '/lookbook', '/le-shop', '/journal', '/plan-du-site'];
// Static pages have no reliable content-change timestamp in the source data; omit
// lastmod rather than falsely claiming that every page changed on each build.
await writeFile(path.join(publicDir, 'sitemap-pages.xml'), urlSet(staticRoutes.map((route) => urlEntry({ loc: absolute(route) }))));
await writeFile(path.join(publicDir, 'sitemap-categories.xml'), urlSet(categories.map((category) => urlEntry({ loc: absolute(`/categorie/${category.slug}`), lastmod: latestModified(category.updated_at, category.content?.modifiedAt, products.filter((product) => product.categories?.slug === category.slug || category.slug === 'dickies' && product.brand?.toLocaleLowerCase('fr') === 'dickies').map(productModified)), images: category.image_url ? [{ url: category.image_url }] : [] })), true));
await writeFile(path.join(publicDir, 'sitemap-products.xml'), urlSet(products.map((product) => urlEntry({ loc: absolute(`/produit/${product.slug}`), lastmod: productModified(product), images: product.product_images.map((image) => ({ url: image.image_url })) })), true));
// These automated guides repeat the product facts and canonicalize to the
// product page. Retain their user-facing URLs, but do not submit duplicates.
await writeFile(path.join(publicDir, 'sitemap-journal.xml'), urlSet([]));

const sitemapNames = ['sitemap-pages.xml', 'sitemap-categories.xml', 'sitemap-products.xml'];
await writeFile(path.join(publicDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapNames.map((name) => `  <sitemap><loc>${xml(absolute(`/${name}`))}</loc></sitemap>`).join('\n')}
</sitemapindex>
`);

await writeFile(path.join(publicDir, 'robots.txt'), `User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

Sitemap: ${absolute('/sitemap.xml')}
`);

const categoryLinks = categories.map((category) => `- [${markdown(category.name)}](${absolute(`/categorie/${category.slug}`)}): ${markdown(category.description) || `${category.product_count} produit(s) dans cette collection.`}`).join('\n');
await writeFile(path.join(publicDir, 'llms.txt'), `# STRUKTUR Grenoble

> Concept store indépendant de vêtements streetwear, sneakers et accessoires au 45 Rue Lesdiguières, 38000 Grenoble, France.

Les informations de prix, de variantes et de disponibilité sur les fiches produit proviennent du catalogue de la boutique. La langue principale est le français et les prix sont affichés en euros.

## Pages principales

- [Accueil](${absolute('/')}): Présentation de STRUKTUR Grenoble.
- [Boutique](${absolute('/boutique')}): Catalogue complet des produits actifs.
- [Nouveautés](${absolute('/nouveautes')}): Sélection actuelle.
- [Journal](${absolute('/journal')}): Guides factuels liés aux produits du catalogue.
- [Marques](${absolute('/marques')}): Marques et univers sélectionnés.
- [Le shop](${absolute('/le-shop')}): Adresse, horaires et informations sur la boutique physique.

## Collections

${categoryLinks || '- Les collections sont publiées depuis le catalogue.'}

## Informations détaillées

- [Catalogue complet pour assistants IA](${absolute('/llms-full.txt')}): Produits, descriptions, prix, variantes et URLs canoniques.
- [Sitemap XML](${absolute('/sitemap.xml')}): Index des sitemaps du site.

## Contact

- Adresse : 45 Rue Lesdiguières, 38000 Grenoble, France
- Téléphone : +33 7 86 38 07 36
- Instagram : https://www.instagram.com/struktur.kultur/
`);

const privateHeaders = [...PRIVATE_ROUTES.flatMap((route) => [route, '  X-Robots-Tag: noindex, nofollow', `${route}/*`, '  X-Robots-Tag: noindex, nofollow']),
  '/404', '  X-Robots-Tag: noindex, nofollow',
  '/app-shell', '  X-Robots-Tag: noindex, nofollow',
  'https://:project.pages.dev/*', '  X-Robots-Tag: noindex, follow',
  'https://:version.:project.pages.dev/*', '  X-Robots-Tag: noindex, follow', ''].join('\n');
const stagingHeaders = isIndexable ? '' : ['/*', '  X-Robots-Tag: noindex, follow', ''].join('\n');
const seoHeaders = [
  '/sitemap*.xml',
  '  Content-Type: application/xml; charset=utf-8',
  '  Cache-Control: public, max-age=3600',
  '/robots.txt',
  '  Content-Type: text/plain; charset=utf-8',
  '/llms*.txt',
  '  Content-Type: text/plain; charset=utf-8',
  '',
].join('\n');
await writeFile(path.join(publicDir, '_headers'), stagingHeaders + privateHeaders + seoHeaders);

const productDetails = products.map((product) => {
  const price = catalogPriceCents(product);
  const variants = product.product_variants.map((variant) => `${variant.name || variant.sku} (${variant.stock_quantity > 0 ? 'en stock' : 'indisponible'})`).join(', ');
  return `### ${markdown(product.name)}${product.brand ? ` — ${markdown(product.brand)}` : ''}

- Fiche produit : ${absolute(`/produit/${product.slug}`)}
- Catégorie : ${markdown(product.categories?.name) || 'Non renseignée'}
- Prix catalogue à partir de : ${(price / 100).toFixed(2)} ${product.currency}
- Description : ${markdown(product.description) || 'Aucune description supplémentaire publiée.'}
- Variantes : ${markdown(variants) || 'Aucune variante publiée.'}`;
}).join('\n\n');

await writeFile(path.join(publicDir, 'llms-full.txt'), `# Catalogue STRUKTUR Grenoble

Généré depuis le catalogue public le ${today}. La disponibilité peut évoluer : la fiche produit fait foi.

${productDetails || 'Aucun produit actif n’est publié actuellement.'}
`);

await writeFile(path.join(publicDir, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Journal STRUKTUR Grenoble</title>
  <link>${xml(absolute('/journal'))}</link>
  <description>Guides produits et sélection de STRUKTUR Grenoble.</description>
  <language>fr-FR</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
</channel></rss>
`);

console.log(`[seo] Generated sitemaps, robots, AI files and RSS for ${products.length} active products and ${categories.length} categories.`);
