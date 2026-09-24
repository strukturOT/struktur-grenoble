import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const cacheDir = path.join(root, '.seo');
const cachePath = path.join(cacheDir, 'catalog.json');

async function loadEnvFile(fileName) {
  try {
    const content = await readFile(path.join(root, fileName), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
      process.env[match[1]] = value;
    }
  } catch {
    // CI normally provides environment variables directly.
  }
}

await loadEnvFile('.env.local');
await loadEnvFile('.env');

const configuredSiteUrl = process.env.VITE_SITE_URL;
// Use the stable Cloudflare Pages project hostname before a custom domain is selected.
// Deployment-specific CF_PAGES_URL is preferred in Pages builds; localhost must never
// leak into canonical URLs, sitemaps, llms.txt, or prerendered metadata.
const defaultPagesUrl = 'https://struktur-grenoble-4f0.pages.dev';
const siteUrl = (configuredSiteUrl || process.env.CF_PAGES_URL || defaultPagesUrl).replace(/\/$/, '');
const isIndexable = Boolean(configuredSiteUrl);
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
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
    return new URL(value, `${siteUrl}/`).href;
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
  const select = 'id,name,slug,brand,description,seo_title,seo_description,price_cents,currency,status,featured,created_at,updated_at,categories(id,name,slug,description,image_url),product_images(image_url,alt_text,position),product_variants(name,sku,price_cents,stock_quantity,position,attributes)';
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
  if (process.env.CI) throw error;
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

const productCounts = new Map();
for (const product of products) {
  const slug = product.categories?.slug;
  if (slug) productCounts.set(slug, (productCounts.get(slug) || 0) + 1);
}
categories = categories
  .map((category) => ({ ...category, product_count: productCounts.get(category.slug) || 0 }))
  .filter((category) => category.product_count > 0);

await mkdir(publicDir, { recursive: true });
await mkdir(cacheDir, { recursive: true });
await writeFile(cachePath, `${JSON.stringify({ generatedAt: today, siteUrl, products, categories }, null, 2)}\n`);

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
      <image:title>${xml(image.title)}</image:title>
    </image:image>`).join('')}
  </url>`;

const staticRoutes = ['/', '/nouveautes', '/boutique', '/marques', '/lookbook', '/le-shop', '/journal'];
// Static pages have no reliable content-change timestamp in the source data; omit
// lastmod rather than falsely claiming that every page changed on each build.
await writeFile(path.join(publicDir, 'sitemap-pages.xml'), urlSet(staticRoutes.map((route) => urlEntry({ loc: absolute(route) }))));
await writeFile(path.join(publicDir, 'sitemap-categories.xml'), urlSet(categories.map((category) => urlEntry({ loc: absolute(`/categorie/${category.slug}`), lastmod: category.updated_at, images: category.image_url ? [{ url: category.image_url, title: `Collection ${category.name} chez STRUKTUR Grenoble` }] : [] })), true));
await writeFile(path.join(publicDir, 'sitemap-products.xml'), urlSet(products.map((product) => urlEntry({ loc: absolute(`/produit/${product.slug}`), lastmod: product.updated_at, images: product.product_images.map((image) => ({ url: image.image_url, title: image.alt_text || product.name })) })), true));
await writeFile(path.join(publicDir, 'sitemap-journal.xml'), urlSet(products.map((product) => urlEntry({ loc: absolute(`/journal/${product.slug}`), lastmod: product.updated_at }))));

const sitemapNames = ['sitemap-pages.xml', 'sitemap-categories.xml', 'sitemap-products.xml', 'sitemap-journal.xml'];
await writeFile(path.join(publicDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapNames.map((name) => `  <sitemap><loc>${xml(absolute(`/${name}`))}</loc><lastmod>${xml(today)}</lastmod></sitemap>`).join('\n')}
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

const privateHeaders = [
  '/admin',
  '  X-Robots-Tag: noindex, nofollow',
  '/admin/*',
  '  X-Robots-Tag: noindex, nofollow',
  '/compte',
  '  X-Robots-Tag: noindex, nofollow',
  '/panier',
  '  X-Robots-Tag: noindex, nofollow',
  '/checkout',
  '  X-Robots-Tag: noindex, nofollow',
  '',
].join('\n');
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
  const price = Math.min(product.price_cents, ...product.product_variants.map((variant) => variant.price_cents ?? product.price_cents));
  const variants = product.product_variants.map((variant) => `${variant.name || variant.sku} (${variant.stock_quantity > 0 ? 'en stock' : 'indisponible'})`).join(', ');
  return `### ${markdown(product.name)}${product.brand ? ` — ${markdown(product.brand)}` : ''}

- Fiche produit : ${absolute(`/produit/${product.slug}`)}
- Guide : ${absolute(`/journal/${product.slug}`)}
- Catégorie : ${markdown(product.categories?.name) || 'Non renseignée'}
- Prix catalogue à partir de : ${(price / 100).toFixed(2)} ${product.currency}
- Description : ${markdown(product.description) || 'Aucune description supplémentaire publiée.'}
- Variantes : ${markdown(variants) || 'Aucune variante publiée.'}`;
}).join('\n\n');

await writeFile(path.join(publicDir, 'llms-full.txt'), `# Catalogue STRUKTUR Grenoble

Généré depuis le catalogue public le ${today}. La disponibilité peut évoluer : la fiche produit fait foi.

${productDetails || 'Aucun produit actif n’est publié actuellement.'}
`);

const rssItems = products.map((product) => `    <item>
      <title>${xml(`Guide ${product.name}`)}</title>
      <link>${xml(absolute(`/journal/${product.slug}`))}</link>
      <guid isPermaLink="true">${xml(absolute(`/journal/${product.slug}`))}</guid>
      <pubDate>${new Date(product.updated_at || today).toUTCString()}</pubDate>
      <description>${xml(markdown(product.description) || `Guide de ${product.name} chez STRUKTUR Grenoble.`)}</description>
    </item>`).join('\n');
await writeFile(path.join(publicDir, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Journal STRUKTUR Grenoble</title>
  <link>${xml(absolute('/journal'))}</link>
  <description>Guides produits et sélection de STRUKTUR Grenoble.</description>
  <language>fr-FR</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
</channel></rss>
`);

console.log(`[seo] Generated sitemaps, robots, AI files and RSS for ${products.length} active products and ${categories.length} categories.`);
