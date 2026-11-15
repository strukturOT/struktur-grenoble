import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrl, latestModified, productModified } from './seo-utils.mjs';
import { buildProductStructuredData, isGtin13 } from './product-schema.mjs';
import { catalogPriceCents } from './catalog-price.mjs';

const site = 'https://strukturkultur.fr';
const product = {
  id: 'group-id', slug: 'shoe', name: 'Shoe', brand: 'Brand', description: 'Description complète.',
  priceCents: 16000, currency: 'EUR', category: { name: 'Sneakers' },
  images: [{ imageUrl: '/black.jpg', colorway: 'Black' }, { imageUrl: '/red.jpg', colorway: 'Red' }],
  variants: [
    { id: 'black-41', name: '41', sku: 'BLACK41', priceCents: 15000, stockQuantity: 2, attributes: { size: '41', colorway: 'Black', verified_gtin: '4006381333931' } },
    { id: 'red-42', name: '42', sku: 'RED42', priceCents: 17000, stockQuantity: 0, attributes: { size: '42', colorway: 'Red', ean: '4006381333932' } },
  ],
};

test('canonicals collapse filters, tracking, fragments, HTML and trailing slash aliases', () => {
  assert.equal(canonicalUrl(site, '/boutique?marque=Saucony&utm_source=test#grid'), `${site}/boutique`);
  assert.equal(canonicalUrl(site, '/produit/shoe.html?variante=one'), `${site}/produit/shoe`);
  assert.equal(canonicalUrl(site, '/categorie/saucony/'), `${site}/categorie/saucony`);
  assert.equal(canonicalUrl(site, '/index.html'), site);
  assert.throws(() => canonicalUrl(site, '//other.example/'), /configured site/);
});

test('lastmod follows catalogue changes rather than build time', () => {
  assert.equal(latestModified(null, 'invalid'), undefined);
  assert.equal(productModified({ updated_at: '2026-10-01', product_variants: [{ updated_at: '2026-11-04' }], product_images: [{ created_at: '2026-10-30' }] }), '2026-11-04T00:00:00.000Z');
});

test('variants expose selectable distinct URLs, exact prices, availability, images and validated identifiers', () => {
  const schema = buildProductStructuredData(product, site);
  assert.equal(schema['@type'], 'ProductGroup');
  assert.equal(schema.productGroupID, product.id);
  assert.deepEqual(schema.variesBy, ['https://schema.org/color', 'https://schema.org/size']);
  const [black, red] = schema.hasVariant;
  assert.equal(black.offers.url, `${site}/produit/shoe?variante=black-41`);
  assert.equal(black.offers.price, '150.00');
  assert.equal(black.offers.availability, 'https://schema.org/InStock');
  assert.deepEqual(black.image, [`${site}/black.jpg`]);
  assert.equal(black.gtin13, '4006381333931');
  assert.equal(red.offers.price, '170.00');
  assert.equal(red.offers.availability, 'https://schema.org/OutOfStock');
  assert.deepEqual(red.image, [`${site}/red.jpg`]);
  assert.equal(red.gtin13, undefined);
});

test('simple products have an exact offer and never invent a zero-price offer or GTIN', () => {
  const simple = buildProductStructuredData({ ...product, images: [], variants: [product.variants[0]] }, site);
  assert.equal(simple['@type'], 'Product');
  assert.equal(simple.sku, 'BLACK41');
  assert.equal(simple.offers[0].price, '150.00');
  const empty = buildProductStructuredData({ ...product, variants: [{ ...product.variants[0], priceCents: 0 }] }, site);
  assert.equal(empty.offers, undefined);
  assert.equal(isGtin13('supplier-ref'), false);
  const posBarcode = buildProductStructuredData({ ...product, variants: [{ ...product.variants[0], attributes: { ean: '1000000016284' } }] }, site);
  assert.equal(posBarcode.gtin13, undefined);
});

test('search offers apply the current percentage to each variant and stop at the promotion end', () => {
  const promoted = { ...product, promotion: { type: 'percentage', value: 20, enabled: true,
    startsAt: '2026-11-01T00:00:00Z', endsAt: '2026-11-16T00:00:00Z' } };
  const current = buildProductStructuredData(promoted, site, Date.parse('2026-11-15T12:00:00Z'));
  assert.equal(current.hasVariant[0].offers.price, '120.00');
  assert.equal(current.hasVariant[1].offers.price, '136.00');
  assert.equal(current.hasVariant[1].offers.availability, 'https://schema.org/OutOfStock');
  const expired = buildProductStructuredData(promoted, site, Date.parse('2026-11-16T00:00:00Z'));
  assert.equal(expired.hasVariant[0].offers.price, '150.00');
  assert.equal(expired.hasVariant[1].offers.price, '170.00');
});

test('catalogue exports use available effective variant prices and base-price inheritance', () => {
  const raw = { price_cents: 12000, promotion_type: 'percentage', promotion_value: 25, promotion_enabled: true,
    product_variants: [{ id: 'sold-out', price_cents: 5000, stock_quantity: 0 },
      { id: 'in-stock', price_cents: null, stock_quantity: 2 }] };
  assert.equal(catalogPriceCents(raw), 9000);
  assert.equal(catalogPriceCents({ ...raw, promotion_enabled: false }), 12000);
  assert.equal(catalogPriceCents({ ...raw, product_variants: raw.product_variants.map((variant) => ({ ...variant, stock_quantity: 0 })) }), 3750);
  const inherited = buildProductStructuredData({ ...product, promotion: { type: 'percentage', value: 25, enabled: true },
    variants: [{ ...product.variants[0], priceCents: null }] }, site);
  assert.equal(inherited.offers[0].price, '120.00');
});

test('fixed promotional prices never increase a cheaper variant or create a zero-price offer', () => {
  const fixed = { ...product, promotion: { type: 'fixed_price', value: 8000, enabled: true }, variants: [
    { ...product.variants[0], priceCents: 5000 }, product.variants[1],
  ] };
  const schema = buildProductStructuredData(fixed, site);
  assert.equal(schema.hasVariant[0].offers.price, '50.00');
  assert.equal(schema.hasVariant[1].offers.price, '80.00');
  const invalid = buildProductStructuredData({ ...fixed, variants: [{ ...fixed.variants[0], priceCents: 0 }] }, site);
  assert.equal(invalid.offers, undefined);
});
