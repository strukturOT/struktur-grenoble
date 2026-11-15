/** Outlet membership is independent from the product's original category. */
export function isOutletProduct(product, category) {
  if (typeof product?.isOutlet === 'boolean') return product.isOutlet;
  if (typeof product?.is_outlet === 'boolean') return product.is_outlet;
  // Compatibility for older catalogue fixtures; persisted rows always carry the flag.
  return Boolean(product?.category?.slug === 'outlet' || product?.categories?.slug === 'outlet'
    || (category?.slug === 'outlet' && (product?.category_id ?? product?.category?.id) === category.id));
}

export function productInCategory(product, category) {
  if (!category) return false;
  if (category.slug === 'outlet') return isOutletProduct(product, category);
  return (product?.category?.id ?? product?.categories?.id ?? product?.category_id) === category.id
    || (category.slug === 'dickies' && product?.brand?.toLocaleLowerCase('fr') === 'dickies');
}
