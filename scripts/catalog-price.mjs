export function catalogPriceCents(product) {
  const variants = (product.product_variants ?? [])
    .map((variant) => ({ price: variant.price_cents ?? product.price_cents, inStock: variant.stock_quantity > 0 }))
    .filter(({ price }) => Number.isInteger(price) && price > 0);
  const available = variants.filter(({ inStock }) => inStock).map(({ price }) => price);
  const prices = available.length ? available : variants.map(({ price }) => price);
  return prices.length ? Math.min(...prices) : Number.isInteger(product.price_cents) && product.price_cents > 0 ? product.price_cents : 0;
}
