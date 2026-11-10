import { buildProductStructuredData } from '../scripts/product-schema.mjs';
import { catalogPriceCents } from '../scripts/catalog-price.mjs';
import { latestModified, productModified } from '../scripts/seo-utils.mjs';

const html = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const xml = html;
const text = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const validSlug = (value) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const publicProduct = (product) => product.status === 'active' && validSlug(product.slug) && !product.slug.startsWith('test-');
const PRODUCT_SELECT = 'id,name,slug,brand,description,seo_title,seo_description,price_cents,currency,status,featured,created_at,updated_at,category_id,categories(id,name,slug,description,image_url),product_images(image_url,alt_text,position,created_at),product_variants(id,name,sku,price_cents,stock_quantity,position,attributes,updated_at)';
const SITEMAP_SELECT = 'id,slug,brand,category_id,status,updated_at,product_variants(updated_at),product_images(image_url,created_at)';
const CATEGORY_SELECT = 'id,name,slug,description,image_url,updated_at';
const pages = ['/', '/nouveautes', '/boutique', '/marques', '/lookbook', '/le-shop', '/journal', '/plan-du-site'];

function normalizedProduct(product) {
  const images = [...(product.product_images || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
  const variants = [...(product.product_variants || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
  return {
    id: product.id, slug: product.slug, name: product.name, brand: product.brand,
    description: product.description, seoDescription: product.seo_description,
    priceCents: product.price_cents, currency: product.currency, category: product.categories,
    images: images.map((image) => ({ imageUrl: image.image_url, colorway: product.brand?.toLowerCase() === 'saucony' && image.alt_text?.startsWith(`${product.name} — `)
      ? image.alt_text.slice(`${product.name} — `.length).split(' — ')[0] : null })),
    variants: variants.map((variant) => ({ id: variant.id, name: variant.name, sku: variant.sku,
      priceCents: variant.price_cents, stockQuantity: variant.stock_quantity, attributes: variant.attributes || {} })),
  };
}

function descriptionFor(product) {
  const description = text(product.seo_description || product.description)
    || `${product.name}${product.brand ? ` par ${product.brand}` : ''}, dans la sélection STRUKTUR Grenoble.`;
  return description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description;
}

const breadcrumb = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })) });

function renderHtml(template, metadata, body) {
  if (!template.includes('<!--struktur-shell-start-->') || !template.includes('</head>')) throw new Error('App shell unavailable');
  const tags = [
    ['name', 'description', metadata.description], ['name', 'robots', metadata.robots],
    ['property', 'og:title', metadata.title], ['property', 'og:description', metadata.description],
    ['property', 'og:url', metadata.canonical], ['property', 'og:type', metadata.type || 'website'],
    ['property', 'og:image', metadata.image], ['name', 'twitter:title', metadata.title],
    ['name', 'twitter:description', metadata.description], ['name', 'twitter:image', metadata.image],
  ];
  let output = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${html(metadata.title)}</title>`)
    .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, '')
    .replace(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, '');
  for (const [attribute, key] of tags) {
    output = output.replace(new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${key}["'])[^>]*>`, 'gi'), '');
  }
  const head = tags.filter(([, , value]) => value).map(([attribute, key, value]) => `<meta ${attribute}="${key}" content="${html(value)}" />`).join('\n');
  const schema = metadata.jsonLd ? `<script id="struktur-page-jsonld" type="application/ld+json">${JSON.stringify(metadata.jsonLd).replace(/</g, '\\u003c')}</script>` : '';
  output = output.replace('</head>', `${head}\n<link rel="canonical" href="${html(metadata.canonical)}" />\n${schema}\n</head>`);
  return output.replace(/<!--struktur-shell-start-->[\s\S]*?<!--struktur-shell-end-->/, body);
}

function imageForVariant(product, variant) {
  const images = [...(product.product_images || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
  const color = variant?.attributes?.colorway;
  if (product.brand?.toLowerCase() === 'saucony' && color) return images.find((image) => image.alt_text?.startsWith(`${product.name} — ${color} — `));
  return images[0];
}

function preferredVariant(product) {
  return [...(product.product_variants || [])]
    .filter((variant) => variant.stock_quantity > 0 && (variant.price_cents ?? product.price_cents) > 0)
    .sort((a, b) => (a.price_cents ?? product.price_cents) - (b.price_cents ?? product.price_cents) || (a.position || 0) - (b.position || 0))[0];
}

function productMarkup(product, canonical, selected) {
  const image = imageForVariant(product, selected || preferredVariant(product));
  const variants = [...(product.product_variants || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
  const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: product.currency || 'EUR' });
  const price = money.format((selected ? selected.price_cents ?? product.price_cents : catalogPriceCents(product)) / 100);
  const rows = variants.map((variant) => `<tr><td><a href="${html(canonical)}?variante=${html(encodeURIComponent(variant.id))}">${html([variant.attributes?.colorway, variant.name].filter(Boolean).join(' — ') || variant.sku)}</a></td><td>${html(money.format((variant.price_cents ?? product.price_cents) / 100))}</td><td>${variant.stock_quantity > 0 ? 'En stock' : 'Indisponible'}</td></tr>`).join('');
  return `<main style="padding:8rem 2rem;max-width:1000px;margin:auto"><article><nav aria-label="Fil d’Ariane"><a href="/">Accueil</a> / <a href="/boutique">Boutique</a>${product.categories ? ` / <a href="/categorie/${html(product.categories.slug)}">${html(product.categories.name)}</a>` : ''}</nav><p>${html(product.brand || 'STRUKTUR')}</p><h1>${html(product.name)}</h1>${image ? `<img src="${html(image.image_url)}" alt="${html(image.alt_text || product.name)}" width="640" height="800" style="max-width:100%;height:auto;max-height:600px;object-fit:contain" />` : ''}<p>${html(text(product.description) || descriptionFor(product))}</p>${selected ? `<p>Variante sélectionnée : ${html([selected.attributes?.colorway, selected.name || selected.sku].filter(Boolean).join(' — '))} · ${selected.stock_quantity > 0 ? 'En stock' : 'Indisponible'}</p>` : ''}<p>${selected ? '' : 'À partir de '}${html(price)} TTC</p><h2>Tailles et disponibilité</h2><table><thead><tr><th>Variante</th><th>Prix TTC</th><th>Disponibilité</th></tr></thead><tbody>${rows}</tbody></table><p>Sélectionnez une taille sur cette fiche pour ajouter la pièce au panier.</p><p><a href="/boutique">Toutes les pièces</a> · <a href="/le-shop">La boutique à Grenoble</a></p></article></main>`;
}

function collectionMarkup(category, products, content) {
  const cards = products.map((product) => `<li><a href="/produit/${html(product.slug)}">${html(product.name)}</a></li>`).join('');
  const related = (content?.relatedSlugs || []).map((slug) => `<li><a href="/categorie/${html(slug)}">${html(slug.replaceAll('-', ' '))}</a></li>`).join('');
  return `<main style="padding:8rem 2rem;max-width:1100px;margin:auto"><nav aria-label="Fil d’Ariane"><a href="/">Accueil</a> / <a href="/boutique">Boutique</a></nav><h1>${html(category.name)} à Grenoble</h1><p>${html(category.description || content?.intro || `Découvrez la sélection ${category.name} de STRUKTUR Grenoble.`)}</p>${content?.detail ? `<p>${html(content.detail)}</p>` : ''}<h2>Les pièces de la collection</h2>${cards ? `<ul>${cards}</ul>` : '<p>Cette collection ne comporte pas encore de pièce publiée. Retrouvez les sélections disponibles dans la boutique.</p>'}${related ? `<h2>À découvrir aussi</h2><ul>${related}</ul>` : ''}<p><a href="/boutique">Toutes les collections</a> · <a href="/le-shop">Nous retrouver à Grenoble</a></p></main>`;
}

const safeImage = (value, origin) => {
  try { const url = new URL(value, `${origin}/`); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
};

function sitemapUrlset(entries, origin) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.map((entry) => `  <url><loc>${xml(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${xml(entry.lastmod)}</lastmod>` : ''}${[...new Set((entry.images || []).map((image) => safeImage(image, origin)).filter(Boolean))].slice(0, 1000).map((image) => `<image:image><image:loc>${xml(image)}</image:loc></image:image>`).join('')}</url>`).join('\n')}\n</urlset>\n`;
}

/** Public reads only. Never accepts request-supplied credentials, filters or database URLs. */
export function createLiveSeoHandlers(config, { fetch: fetcher = globalThis.fetch, collectionContent = {}, timeoutMs = 7000 } = {}) {
  const siteUrl = config.siteUrl.replace(/\/$/, '');
  const indexable = (request) => config.isIndexable === true && !new URL(request.url).hostname.endsWith('.pages.dev');
  const headersFor = (request, { xmlResponse = false, noIndex = false, unavailable = false } = {}) => {
    const headers = new Headers({ 'Content-Type': xmlResponse ? 'application/xml; charset=utf-8' : 'text/html; charset=utf-8', 'Content-Language': 'fr-FR', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
    if (noIndex || unavailable || !indexable(request)) headers.set('X-Robots-Tag', unavailable || !indexable(request) ? 'noindex, follow' : 'noindex, nofollow');
    if (unavailable) headers.set('Retry-After', '60');
    return headers;
  };
  async function rows(table, select, filters = {}, maximum = 50000) {
    const all = [];
    const pageSize = Math.min(500, maximum);
    for (let offset = 0; offset < maximum; offset += pageSize) {
      const params = new URLSearchParams({ select, order: 'id.asc', limit: String(pageSize), offset: String(offset), ...filters });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetcher(`${config.supabaseUrl}/rest/v1/${table}?${params}`, { signal: controller.signal, cache: 'no-store', headers: { apikey: config.supabaseKey, Authorization: `Bearer ${config.supabaseKey}`, Accept: 'application/json' } });
        if (!response.ok) throw new Error('Public catalogue unavailable');
        const batch = await response.json();
        if (!Array.isArray(batch)) throw new Error('Public catalogue response invalid');
        all.push(...batch);
        if (batch.length < pageSize) return all;
      } finally { clearTimeout(timer); }
    }
    if (maximum === 1) return all;
    throw new Error('Catalogue exceeds this sitemap limit');
  }
  const activeProducts = async (select = SITEMAP_SELECT, filters = {}) => (await rows('products', select, { status: 'eq.active', slug: 'not.like.test-%', ...filters })).filter(publicProduct);
  const categoryProducts = async (category, select) => activeProducts(select, category.slug === 'dickies'
    ? { or: `(category_id.eq.${category.id},brand.ilike.Dickies)` }
    : { category_id: `eq.${category.id}` });
  const inCategory = (product, category) => product.category_id === category.id || category.slug === 'dickies' && product.brand?.toLowerCase() === 'dickies';

  async function shell(context) {
    const assetUrl = new URL('/app-shell', context.request.url);
    const response = await context.env.ASSETS.fetch(new Request(assetUrl, { method: 'GET' }));
    if (!response.ok) throw new Error('App shell unavailable');
    return response.text();
  }
  async function pageResponse(context, metadata, markup, status = 200) {
    const noIndex = metadata.noIndex || status !== 200;
    const robots = noIndex ? 'noindex, nofollow' : indexable(context.request) ? 'index, follow, max-image-preview:large' : 'noindex, follow';
    const body = renderHtml(await shell(context), { ...metadata, robots, image: metadata.image || `${siteUrl}/brand/og-image.webp` }, markup);
    return new Response(context.request.method === 'HEAD' ? null : body, { status, headers: headersFor(context.request, { noIndex, unavailable: status === 503 }) });
  }
  async function failure(context, status) {
    const unavailable = status === 503;
    const title = unavailable ? 'Boutique temporairement indisponible' : 'Page introuvable';
    const description = unavailable ? 'Le catalogue est momentanément indisponible. Merci de réessayer dans quelques instants.' : 'Cette page n’existe pas ou n’est plus disponible.';
    const metadata = { title: `${title} | STRUKTUR Grenoble`, description, canonical: `${siteUrl}${new URL(context.request.url).pathname.replace(/\/$/, '')}`, noIndex: true };
    const markup = `<main style="padding:8rem 2rem;max-width:900px;margin:auto"><h1>${title}</h1><p>${description}</p><a href="/boutique">Retour à la boutique</a></main>`;
    try { return await pageResponse(context, metadata, markup, status); }
    catch { return new Response(context.request.method === 'HEAD' ? null : `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>${title}</title></head><body>${markup}</body></html>`, { status, headers: headersFor(context.request, { noIndex: true, unavailable }) }); }
  }
  function methodResponse(request) {
    if (request.method === 'GET' || request.method === 'HEAD') return null;
    const headers = headersFor(request, { noIndex: true }); headers.set('Allow', 'GET, HEAD');
    return new Response('Method not allowed', { status: 405, headers });
  }
  function normalizeRoute(request, kind) {
    const url = new URL(request.url);
    if (kind === 'produit' && config.productRedirects?.[url.pathname]) return Response.redirect(`${siteUrl}${config.productRedirects[url.pathname]}${url.search}`, 301);
    const path = url.pathname.replace(/\.html\/?$/, '').replace(/\/$/, '');
    if (path !== url.pathname) return Response.redirect(`${url.origin}${path}${url.search}`, 301);
    return null;
  }

  return {
    async htmlSitemap(context) {
      const method = methodResponse(context.request); if (method) return method;
      const redirect = normalizeRoute(context.request, 'plan-du-site'); if (redirect) return redirect;
      try {
        const [sourceProducts, categories] = await Promise.all([activeProducts('id,name,slug,brand,category_id,status'), rows('categories', CATEGORY_SELECT)]);
        const compare = new Intl.Collator('fr', { sensitivity: 'base', numeric: true }).compare;
        const products = [...sourceProducts].sort((a, b) => compare(a.name, b.name));
        const visibleCategories = categories.filter((category) => validSlug(category.slug) && products.some((product) => inCategory(product, category))).sort((a, b) => compare(a.name, b.name));
        const names = { '/': 'Accueil', '/nouveautes': 'Nouveautés', '/boutique': 'Boutique', '/marques': 'Marques', '/lookbook': 'Lookbook', '/le-shop': 'Le shop à Grenoble', '/journal': 'Journal et guides' };
        const pageLinks = pages.filter((path) => path !== '/plan-du-site').map((path) => `<li><a href="${path}">${names[path]}</a></li>`).join('');
        const categoryLinks = visibleCategories.map((category) => `<li><a href="/categorie/${html(category.slug)}">${html(category.name)}</a></li>`).join('');
        const productLinks = products.map((product) => `<li><a href="/produit/${html(product.slug)}">${html(product.name)}</a>${product.brand ? ` — ${html(product.brand)}` : ''}</li>`).join('');
        const markup = `<main style="padding:8rem 2rem;max-width:1100px;margin:auto"><h1>Plan du site</h1><p>Retrouvez les pages principales, les collections et toutes les pièces publiées dans notre boutique.</p><nav aria-labelledby="site-main-pages"><h2 id="site-main-pages">Pages principales</h2><ul>${pageLinks}</ul></nav><nav aria-labelledby="site-collections"><h2 id="site-collections">Collections</h2><ul>${categoryLinks}</ul></nav><section aria-labelledby="site-products"><h2 id="site-products">Tous les produits</h2><p>${products.length} produit${products.length !== 1 ? 's' : ''} publié${products.length !== 1 ? 's' : ''}</p><ul>${productLinks}</ul></section></main>`;
        const canonical = `${siteUrl}/plan-du-site`;
        const schema = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${canonical}#directory`, name: 'Plan du site STRUKTUR Grenoble', url: canonical, mainEntity: { '@type': 'ItemList', numberOfItems: products.length, itemListElement: products.map((product, index) => ({ '@type': 'ListItem', position: index + 1, name: product.name, url: `${siteUrl}/produit/${product.slug}` })) } }, breadcrumb([{ name: 'Accueil', url: siteUrl }, { name: 'Plan du site', url: canonical }])];
        return await pageResponse(context, { title: 'Plan du site | STRUKTUR Grenoble', description: 'Retrouvez les pages, les collections et tous les produits publiés dans la boutique STRUKTUR Grenoble.', canonical, jsonLd: schema }, markup);
      } catch { return failure(context, 503); }
    },
    async product(context) {
      const method = methodResponse(context.request); if (method) return method;
      const redirect = normalizeRoute(context.request, 'produit'); if (redirect) return redirect;
      const slug = context.params.slug;
      if (!validSlug(slug) || slug.startsWith('test-')) return failure(context, 404);
      try {
        const product = (await rows('products', PRODUCT_SELECT, { status: 'eq.active', slug: `eq.${slug}` }, 1)).find((row) => publicProduct(row) && row.slug === slug);
        if (!product) return failure(context, 404);
        const canonical = `${siteUrl}/produit/${product.slug}`;
        const schema = buildProductStructuredData(normalizedProduct(product), siteUrl);
        const selected = product.product_variants?.find((variant) => variant.id === new URL(context.request.url).searchParams.get('variante'));
        return await pageResponse(context, { title: text(product.seo_title) || `${product.name}${product.brand ? ` par ${product.brand}` : ''} | STRUKTUR Grenoble`, description: descriptionFor(product), canonical, image: imageForVariant(product, selected || preferredVariant(product))?.image_url, type: 'product', jsonLd: [schema, breadcrumb([{ name: 'Accueil', url: siteUrl }, { name: 'Boutique', url: `${siteUrl}/boutique` }, { name: product.name, url: canonical }])] }, productMarkup(product, canonical, selected));
      } catch { return failure(context, 503); }
    },
    async category(context) {
      const method = methodResponse(context.request); if (method) return method;
      const redirect = normalizeRoute(context.request, 'categorie'); if (redirect) return redirect;
      if (!validSlug(context.params.slug)) return failure(context, 404);
      try {
        const category = (await rows('categories', CATEGORY_SELECT, { slug: `eq.${context.params.slug}` }, 1)).find((row) => row.slug === context.params.slug);
        if (!category) return failure(context, 404);
        const products = await categoryProducts(category, 'id,name,slug,brand,category_id,status');
        const content = collectionContent[category.slug];
        const canonical = `${siteUrl}/categorie/${category.slug}`;
        const title = content?.title || `${category.name} | STRUKTUR Grenoble`;
        const description = content?.description || text(category.description) || `Découvrez la sélection ${category.name} de STRUKTUR Grenoble.`;
        const schema = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${canonical}#collection`, url: canonical, name: title, description, mainEntity: { '@type': 'ItemList', numberOfItems: products.length, itemListElement: products.map((product, index) => ({ '@type': 'ListItem', position: index + 1, name: product.name, url: `${siteUrl}/produit/${product.slug}` })) } }, breadcrumb([{ name: 'Accueil', url: siteUrl }, { name: 'Boutique', url: `${siteUrl}/boutique` }, { name: category.name, url: canonical }])];
        return await pageResponse(context, { title, description, canonical, image: category.image_url, jsonLd: schema, noIndex: products.length === 0 }, collectionMarkup(category, products, content));
      } catch { return failure(context, 503); }
    },
    async sitemap(context, kind) {
      const method = methodResponse(context.request); if (method) return method;
      try {
        let body;
        if (kind === 'products') {
          const products = await activeProducts();
          body = sitemapUrlset(products.map((product) => ({ loc: `${siteUrl}/produit/${product.slug}`, lastmod: productModified(product), images: (product.product_images || []).map((image) => image.image_url) })), siteUrl);
        } else {
          const [products, categories] = await Promise.all([activeProducts(), rows('categories', CATEGORY_SELECT)]);
          const visibleCategories = categories.filter((category) => validSlug(category.slug) && products.some((product) => inCategory(product, category)));
          if (kind === 'categories') {
            body = sitemapUrlset(visibleCategories.map((category) => ({ loc: `${siteUrl}/categorie/${category.slug}`, lastmod: latestModified(category.updated_at, collectionContent[category.slug]?.modifiedAt, products.filter((product) => inCategory(product, category)).map(productModified)), images: category.image_url ? [category.image_url] : [] })), siteUrl);
          } else {
            const children = ['sitemap-pages.xml', ...(visibleCategories.length ? ['sitemap-categories.xml'] : []), ...(products.length ? ['sitemap-products.xml'] : [])];
            body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${children.map((name) => `<sitemap><loc>${xml(`${siteUrl}/${name}`)}</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`;
          }
        }
        return new Response(context.request.method === 'HEAD' ? null : body, { status: 200, headers: headersFor(context.request, { xmlResponse: true }) });
      } catch {
        return new Response(context.request.method === 'HEAD' ? null : '<?xml version="1.0" encoding="UTF-8"?><error>Catalogue temporairement indisponible. Réessayez dans quelques instants.</error>', { status: 503, headers: headersFor(context.request, { xmlResponse: true, unavailable: true }) });
      }
    },
  };
}

export { PRODUCT_SELECT, SITEMAP_SELECT, pages as STATIC_PUBLIC_ROUTES };
