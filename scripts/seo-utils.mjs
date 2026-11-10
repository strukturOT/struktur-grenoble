export const PRIVATE_ROUTES = ['/admin', '/compte', '/panier', '/checkout'];

/** Canonicals always identify an internal, extension-less page, never a filter or tracking URL. */
export function canonicalUrl(siteUrl, route = '/') {
  const url = new URL(route, `${siteUrl}/`);
  if (url.origin !== new URL(siteUrl).origin) throw new Error('[seo] Canonical routes must stay on the configured site.');
  const pathname = url.pathname.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '').replace(/\/+$/, '') || '/';
  return `${new URL(siteUrl).origin}${pathname === '/' ? '' : pathname}`;
}

export function latestModified(...values) {
  const valid = values.flat(Infinity).map((value) => value ? new Date(value).getTime() : NaN).filter(Number.isFinite);
  return valid.length ? new Date(Math.max(...valid)).toISOString() : undefined;
}

export function productModified(product) {
  return latestModified(product.updated_at,
    (product.product_variants || []).map((variant) => variant.updated_at),
    (product.product_images || []).map((image) => image.created_at));
}
