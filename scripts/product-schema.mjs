const text = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const imageUrls = (images, siteUrl) => [...new Set(images.map((image) => {
  try {
    const url = new URL(image.imageUrl, `${siteUrl}/`);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}).filter(Boolean))];

export const isGtin13 = (value) => typeof value === 'string' && /^\d{13}$/.test(value)
  && [...value.slice(0, 12)].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0) % 10 === (10 - Number(value[12])) % 10;

/** One product page, with a distinct, selectable URL and accurate offer for every variant. */
export function buildProductStructuredData(product, siteUrl) {
  const url = `${siteUrl}/produit/${encodeURIComponent(product.slug)}`;
  const description = text(product.description || product.seoDescription || product.name);
  const common = {
    name: product.name,
    description,
    image: imageUrls(product.images, siteUrl),
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    category: product.category?.name,
  };
  const variants = product.variants.filter((variant) => variant.id
    && Number.isInteger(variant.priceCents ?? product.priceCents)
    && (variant.priceCents ?? product.priceCents) > 0);
  const colorOf = (variant) => text(variant.attributes?.colorway || variant.attributes?.color);
  const sizeOf = (variant) => text(variant.attributes?.size || variant.name);
  const variantsDifferBy = [];
  if (new Set(variants.map(colorOf).filter(Boolean)).size > 1) variantsDifferBy.push('https://schema.org/color');
  if (new Set(variants.map(sizeOf).filter(Boolean)).size > 1) variantsDifferBy.push('https://schema.org/size');
  const grouped = variants.length > 1 && variantsDifferBy.length > 0;
  const offerFor = (variant) => ({
    '@type': 'Offer',
    url: `${url}?variante=${encodeURIComponent(variant.id)}`,
    priceCurrency: product.currency,
    price: ((variant.priceCents ?? product.priceCents) / 100).toFixed(2),
    availability: variant.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', '@id': `${siteUrl}/#store`, name: 'STRUKTUR Grenoble' },
  });
  const variantProduct = (variant) => {
    const color = colorOf(variant);
    const size = sizeOf(variant);
    const images = color && product.images.some((image) => image.colorway)
      ? product.images.filter((image) => image.colorway === color)
      : product.images;
    // POS gencodes and internal EAN-shaped barcodes are not manufacturer GTINs.
    // Only identifiers explicitly verified against a manufacturer source qualify.
    const gtin = variant.attributes?.verified_gtin || variant.attributes?.manufacturer_gtin;
    return {
      '@type': 'Product',
      '@id': `${url}#variant-${encodeURIComponent(variant.id)}`,
      name: [product.name, color, size].filter(Boolean).join(' — '),
      // Common description/brand live on ProductGroup; keep one exact variant
      // image instead of repeating its entire gallery for every shoe size.
      image: imageUrls(images, siteUrl).slice(0, 1),
      sku: variant.sku,
      ...(isGtin13(gtin) ? { gtin13: gtin } : {}),
      ...(variant.attributes?.manufacturer_reference ? { mpn: text(variant.attributes.manufacturer_reference) } : {}),
      ...(color ? { color } : {}),
      ...(size && !/^standard$/i.test(size) ? { size } : {}),
      ...(grouped ? { inProductGroupWithID: product.id } : {}),
      offers: offerFor(variant),
    };
  };

  if (grouped) return {
    '@context': 'https://schema.org',
    '@type': 'ProductGroup',
    '@id': `${url}#product`,
    ...common,
    url,
    productGroupID: product.id,
    variesBy: variantsDifferBy,
    hasVariant: variants.map(variantProduct),
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    ...common,
    url,
    ...(variants.length === 1 ? {
      sku: variants[0].sku,
      ...(variants[0].attributes?.manufacturer_reference ? { mpn: text(variants[0].attributes.manufacturer_reference) } : {}),
      ...(isGtin13(variants[0].attributes?.verified_gtin || variants[0].attributes?.manufacturer_gtin)
        ? { gtin13: variants[0].attributes.verified_gtin || variants[0].attributes.manufacturer_gtin } : {}),
    } : {}),
    // An empty/invalid catalogue price must never become a zero-price offer.
    ...(variants.length ? { offers: variants.map(offerFor) } : {}),
  };
}
