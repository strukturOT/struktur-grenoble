import test from 'node:test';
import assert from 'node:assert/strict';
import { createLiveSeoHandlers, STATIC_PUBLIC_ROUTES } from '../server/live-seo.mjs';

const template = '<!doctype html><html lang="fr"><head><title>Shell</title><meta name="robots" content="noindex, nofollow"><meta name="description" content="Private shell"><link rel="canonical" href="https://strukturkultur.fr/app-shell"><script type="application/ld+json">{}</script><script type="module" src="/assets/app.js"></script></head><body><div id="root"><!--struktur-shell-start--><main>Chargement…</main><!--struktur-shell-end--></div></body></html>';
const category = { id: 'cat-one', name: 'Marque', slug: 'marque', description: 'Sélection de la marque.', updated_at: '2026-11-01T00:00:00Z' };
const product = () => ({
  id: 'new-product', name: 'Nouvelle pièce <test>', slug: 'nouvelle-piece', brand: 'Marque', status: 'active', category_id: category.id, categories: category,
  description: 'Description complète de la pièce.', price_cents: 12000, currency: 'EUR', updated_at: '2026-11-01T00:00:00Z',
  product_images: [{ image_url: 'https://images.example/piece.jpg', alt_text: 'Nouvelle pièce', position: 0, created_at: '2026-11-02T00:00:00Z' }],
  product_variants: [
    { id: 'variant-m', name: 'M', sku: 'MODEL-M', price_cents: 13000, stock_quantity: 2, attributes: { size: 'M', manufacturer_reference: 'MODEL' }, updated_at: '2026-11-10T12:00:00Z' },
    { id: 'variant-l', name: 'L', sku: 'MODEL-L', price_cents: 14000, stock_quantity: 0, attributes: { size: 'L' }, updated_at: '2026-11-02T00:00:00Z' },
  ],
});
function harness({ products = [], categories = [category], fail = false, isIndexable = true } = {}) {
  const data = { products, categories, fail, calls: [] };
  const config = { siteUrl: 'https://strukturkultur.fr', isIndexable, supabaseUrl: 'https://public-catalogue.example', supabaseKey: 'PUBLIC_FIXTURE', productRedirects: { '/produit/ancien-modele': '/produit/nouvelle-piece' } };
  const fetcher = async (url, options) => {
    data.calls.push({ url, options });
    if (data.fail) return new Response('database temporarily unavailable', { status: 503 });
    const parsed = new URL(url);
    let values = data[parsed.pathname.split('/').at(-1)];
    if (!values) return new Response('not found', { status: 404 });
    values = values.filter((row) => {
      for (const key of ['slug', 'status', 'category_id']) {
        const filter = parsed.searchParams.get(key);
        if (filter?.startsWith('eq.') && row[key] !== filter.slice(3)) return false;
        if (filter === 'not.like.test-%' && row[key]?.startsWith('test-')) return false;
      }
      const or = parsed.searchParams.get('or');
      if (or) {
        const id = or.match(/category_id\.eq\.([^,]+)/)?.[1];
        if (row.category_id !== id && row.brand?.toLowerCase() !== 'dickies') return false;
      }
      return true;
    });
    const offset = Number(parsed.searchParams.get('offset') || 0);
    const limit = Number(parsed.searchParams.get('limit') || 500);
    return Response.json(values.slice(offset, offset + limit));
  };
  const handlers = createLiveSeoHandlers(config, { fetch: fetcher, collectionContent: { marque: { intro: 'Introduction de collection.', detail: 'Conseils de sélection.', title: 'Marque à Grenoble' } } });
  const context = (path, slug, { origin = 'https://strukturkultur.fr', method = 'GET' } = {}) => ({ request: new Request(`${origin}${path}`, { method }), params: { slug }, env: { ASSETS: { fetch: async () => new Response(template, { headers: { 'X-Robots-Tag': 'noindex, nofollow' } }) } } });
  return { data, handlers, context };
}
const schemaFrom = (body) => JSON.parse(body.match(/<script id="struktur-page-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('a newly published product absent from static files becomes crawlable immediately and later edits stay fresh', async () => {
  const h = harness();
  assert.equal((await h.handlers.product(h.context('/produit/nouvelle-piece', 'nouvelle-piece'))).status, 404);
  h.data.products.push(product());
  const response = await h.handlers.product(h.context('/produit/nouvelle-piece?variante=variant-m', 'nouvelle-piece'));
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Robots-Tag'), null);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match(body, /content="index, follow, max-image-preview:large"/);
  assert.match(body, /href="https:\/\/strukturkultur.fr\/produit\/nouvelle-piece"/);
  assert.match(body, /Nouvelle pièce &lt;test&gt;/);
  assert.match(body, /src="\/assets\/app.js"/);
  assert.doesNotMatch(body, /Private shell|PUBLIC_FIXTURE/);
  const group = schemaFrom(body)[0];
  assert.equal(group['@type'], 'ProductGroup');
  assert.equal(group.hasVariant[0].offers.price, '130.00');
  assert.equal(group.hasVariant[0].offers.url, 'https://strukturkultur.fr/produit/nouvelle-piece?variante=variant-m');
  h.data.products[0].product_variants[0].price_cents = 12500;
  h.data.products[0].product_variants[0].stock_quantity = 0;
  const updated = schemaFrom(await (await h.handlers.product(h.context('/produit/nouvelle-piece', 'nouvelle-piece'))).text())[0];
  assert.equal(updated.hasVariant[0].offers.price, '125.00');
  assert.equal(updated.hasVariant[0].offers.availability, 'https://schema.org/OutOfStock');
});

test('archived, test and unknown products return genuine non-indexable 404 responses', async () => {
  const h = harness({ products: [{ ...product(), status: 'archived' }, { ...product(), slug: 'test-demo' }] });
  for (const slug of ['nouvelle-piece', 'test-demo', 'unknown']) {
    const response = await h.handlers.product(h.context(`/produit/${slug}`, slug));
    assert.equal(response.status, 404);
    assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
    assert.match(await response.text(), /Page introuvable/);
  }
});

test('backend failure is a retryable 503, never an empty catalogue or false 404', async () => {
  const h = harness({ fail: true });
  const response = await h.handlers.product(h.context('/produit/nouvelle-piece', 'nouvelle-piece'));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
  assert.doesNotMatch(await response.text(), /database temporarily unavailable/);
  const sitemap = await h.handlers.sitemap(h.context('/sitemap-products.xml'), 'products');
  assert.equal(sitemap.status, 503);
  assert.equal(sitemap.headers.get('Content-Type'), 'application/xml; charset=utf-8');
  assert.equal(sitemap.headers.get('Retry-After'), '60');
});

test('Pages alias and preview builds remain noindex despite successful live catalogue reads', async () => {
  const h = harness({ products: [product()] });
  for (const origin of ['https://struktur-grenoble.pages.dev', 'https://release.struktur-grenoble.pages.dev']) {
    const response = await h.handlers.product(h.context('/produit/nouvelle-piece', 'nouvelle-piece', { origin }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, follow');
    assert.match(await response.text(), /content="noindex, follow"/);
  }
  const preview = harness({ products: [product()], isIndexable: false });
  assert.match((await preview.handlers.sitemap(preview.context('/sitemap.xml'), 'index')).headers.get('X-Robots-Tag'), /noindex/);
});

test('categories published after build have live items, and empty categories are kept out of indexing', async () => {
  const h = harness();
  const empty = await h.handlers.category(h.context('/categorie/marque', 'marque'));
  assert.equal(empty.status, 200);
  assert.match(empty.headers.get('X-Robots-Tag'), /noindex/);
  h.data.products.push(product());
  const response = await h.handlers.category(h.context('/categorie/marque', 'marque'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Robots-Tag'), null);
  const body = await response.text();
  assert.equal(schemaFrom(body)[0].mainEntity.numberOfItems, 1);
  assert.match(body, /href="\/produit\/nouvelle-piece"/);
  assert.match(body, /Sélection de la marque/);
  h.data.categories = [{ ...category, description: 'Description modifiée depuis l’administration.' }];
  const edited = await (await h.handlers.category(h.context('/categorie/marque', 'marque'))).text();
  assert.match(edited, /Description modifiée depuis l’administration/);
  h.data.categories = [{ ...category, description: null }];
  const fallback = await (await h.handlers.category(h.context('/categorie/marque', 'marque'))).text();
  assert.match(fallback, /Introduction de collection/);
  assert.equal((await h.handlers.category(h.context('/categorie/unknown', 'unknown'))).status, 404);
});

test('default colour image matches the available starting price, while explicit variant links retain their own price', async () => {
  const p = product();
  p.brand = 'Saucony';
  p.product_images = [
    { image_url: 'https://images.example/red.jpg', alt_text: `${p.name} — Red — Vue 1`, position: 0 },
    { image_url: 'https://images.example/blue.jpg', alt_text: `${p.name} — Blue — Vue 1`, position: 1 },
  ];
  p.product_variants = [
    { ...p.product_variants[0], price_cents: 17000, stock_quantity: 2, position: 0, attributes: { colorway: 'Red', size: 'M' } },
    { ...p.product_variants[1], price_cents: 13000, stock_quantity: 1, position: 1, attributes: { colorway: 'Blue', size: 'L' } },
  ];
  const h = harness({ products: [p] });
  const initial = await (await h.handlers.product(h.context('/produit/nouvelle-piece', 'nouvelle-piece'))).text();
  assert.match(initial, /property="og:image" content="https:\/\/images.example\/blue.jpg"/);
  assert.match(initial, /À partir de 130,00/);
  const selected = await (await h.handlers.product(h.context('/produit/nouvelle-piece?variante=variant-m', 'nouvelle-piece'))).text();
  assert.match(selected, /property="og:image" content="https:\/\/images.example\/red.jpg"/);
  assert.match(selected, /<p>170,00/);
});

test('fresh sitemaps use current publication state and lastmod includes variant changes', async () => {
  const h = harness();
  const initialIndex = await (await h.handlers.sitemap(h.context('/sitemap.xml'), 'index')).text();
  assert.match(initialIndex, /sitemap-pages.xml/);
  assert.doesNotMatch(initialIndex, /sitemap-products.xml|sitemap-categories.xml|sitemap-journal.xml/);
  h.data.products.push(product(), { ...product(), slug: 'archived-piece', status: 'archived' }, { ...product(), slug: 'test-demo' });
  const index = await (await h.handlers.sitemap(h.context('/sitemap.xml'), 'index')).text();
  assert.equal((index.match(/<sitemap>/g) || []).length, 3);
  const products = await (await h.handlers.sitemap(h.context('/sitemap-products.xml'), 'products')).text();
  assert.match(products, /<loc>https:\/\/strukturkultur.fr\/produit\/nouvelle-piece<\/loc>/);
  assert.match(products, /2026-11-10T12:00:00.000Z/);
  assert.doesNotMatch(products, /archived-piece|test-demo/);
  h.data.products[0].status = 'archived';
  assert.doesNotMatch(await (await h.handlers.sitemap(h.context('/sitemap-products.xml'), 'products')).text(), /nouvelle-piece/);
});

test('sitemap pagination retrieves more than one API page without truncation', async () => {
  const products = Array.from({ length: 501 }, (_, index) => ({ ...product(), id: `id-${index}`, slug: `piece-${index}` }));
  const h = harness({ products });
  const body = await (await h.handlers.sitemap(h.context('/sitemap-products.xml'), 'products')).text();
  assert.equal((body.match(/<url>/g) || []).length, 501);
  assert.equal(h.data.calls.length, 2);
});

test('legacy redirects, HEAD and invalid methods retain safe response semantics', async () => {
  const h = harness({ products: [product()] });
  const redirect = await h.handlers.product(h.context('/produit/ancien-modele?variante=variant-m', 'ancien-modele'));
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('Location'), 'https://strukturkultur.fr/produit/nouvelle-piece?variante=variant-m');
  const head = await h.handlers.product(h.context('/produit/nouvelle-piece', 'nouvelle-piece', { method: 'HEAD' }));
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const post = await h.handlers.product(h.context('/produit/nouvelle-piece', 'nouvelle-piece', { method: 'POST' }));
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('Allow'), 'GET, HEAD');
});

test('variant deep links expose the selected size, price and availability in initial HTML', async () => {
  const h = harness({ products: [product()] });
  const body = await (await h.handlers.product(h.context('/produit/nouvelle-piece?variante=variant-l', 'nouvelle-piece'))).text();
  assert.match(body, /Variante sélectionnée : L · Indisponible/);
  assert.match(body, /140,00/);
  assert.doesNotMatch(body, /À partir de/);
  assert.match(body, /href="https:\/\/strukturkultur.fr\/produit\/nouvelle-piece"/);
});

test('human sitemap is normal canonical HTML and updates after publication without a build', async () => {
  const h = harness();
  assert.equal(STATIC_PUBLIC_ROUTES.length, 8);
  assert.ok(STATIC_PUBLIC_ROUTES.includes('/plan-du-site'));
  const first = await h.handlers.htmlSitemap(h.context('/plan-du-site'));
  assert.equal(first.status, 200);
  assert.equal(schemaFrom(await first.text())[0].mainEntity.numberOfItems, 0);
  h.data.products.push(product(), { ...product(), id: 'archived', slug: 'archived-piece', status: 'archived' }, { ...product(), id: 'test', slug: 'test-demo' });
  const response = await h.handlers.htmlSitemap(h.context('/plan-du-site'));
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
  assert.equal(response.headers.get('X-Robots-Tag'), null);
  assert.match(body, /href="https:\/\/strukturkultur.fr\/plan-du-site"/);
  assert.match(body, /<h1>Plan du site<\/h1>/);
  assert.equal((body.match(/<a href="\/produit\/nouvelle-piece">/g) || []).length, 1);
  assert.match(body, /href="\/categorie\/marque"/);
  assert.equal(schemaFrom(body)[0].mainEntity.numberOfItems, 1);
  assert.doesNotMatch(body, /xml-stylesheet|sitemap\.xsl|archived-piece|test-demo/);
  h.data.products.push({ ...product(), id: 'newer-product', slug: 'published-later', name: 'A later publication' });
  const updated = await (await h.handlers.htmlSitemap(h.context('/plan-du-site'))).text();
  assert.match(updated, /href="\/produit\/published-later"/);
  assert.equal(schemaFrom(updated)[0].mainEntity.numberOfItems, 2);
});

test('machine XML contains no deprecated XSLT presentation and retains three child sitemaps', async () => {
  const h = harness({ products: [product()] });
  for (const kind of ['index', 'products', 'categories']) {
    const response = await h.handlers.sitemap(h.context('/sitemap.xml'), kind);
    const body = await response.text();
    assert.equal(response.headers.get('Content-Type'), 'application/xml; charset=utf-8');
    assert.doesNotMatch(body, /xml-stylesheet|sitemap\.xsl/);
    if (kind === 'index') assert.equal((body.match(/<sitemap>/g) || []).length, 3);
  }
});

test('human sitemap keeps preview noindex and backend failures retryable', async () => {
  const h = harness({ products: [product()] });
  const preview = await h.handlers.htmlSitemap(h.context('/plan-du-site', undefined, { origin: 'https://preview.struktur-grenoble.pages.dev' }));
  assert.equal(preview.headers.get('X-Robots-Tag'), 'noindex, follow');
  h.data.fail = true;
  const failure = await h.handlers.htmlSitemap(h.context('/plan-du-site'));
  assert.equal(failure.status, 503);
  assert.equal(failure.headers.get('Retry-After'), '60');
  assert.match(failure.headers.get('X-Robots-Tag'), /noindex/);
});
