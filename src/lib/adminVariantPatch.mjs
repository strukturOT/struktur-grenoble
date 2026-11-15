/** Existing color/identity edits must not overwrite a newer sale or price change. */
export function variantWriteValues(variant, position) {
  return {
    name: variant.name || null,
    sku: variant.sku,
    ...(!variant.id || !variant.preservePriceCents ? { price_cents: variant.priceCents } : {}),
    ...(!variant.id || !variant.preserveStockQuantity ? { stock_quantity: variant.stockQuantity } : {}),
    attributes: variant.attributes ?? {},
    position,
  };
}
