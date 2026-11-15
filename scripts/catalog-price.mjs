import { productPricing } from '../src/lib/promotions.mjs';

/** Static catalogue exports use the same current price as the storefront. */
export function catalogPriceCents(product, now = Date.now()) {
  return productPricing(product, now).priceCents;
}
