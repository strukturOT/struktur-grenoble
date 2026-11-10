const searchText = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');

export const hasCatalogImage = (product) => Boolean(product?.images?.some((image) => image.imageUrl?.trim()));

/** Failed uploads must leave a product without existing photos unpublished. */
export async function saveProductWithPhotoGuard(product, input, newImage, save, publish) {
  const needsPhoto = input.status === 'active' && !hasCatalogImage(product);
  if (needsPhoto && !newImage) throw new Error('Ajoutez une photo du bon modèle avant de publier ce produit, ou conservez-le en brouillon.');
  const productId = await save({ ...input, status: needsPhoto ? 'draft' : input.status });
  if (needsPhoto) await publish(productId);
  return productId;
}

export function filterAdminCatalog(products, { status = 'all', stock = 'all', query = '' } = {}) {
  const terms = searchText(query).trim().split(/\s+/).filter(Boolean);
  return products.filter((product) => {
    if (status !== 'all' && product.status !== status) return false;
    const available = product.variants.some((variant) => variant.stockQuantity > 0);
    if (stock === 'available' && !available || stock === 'empty' && available) return false;
    if (!terms.length) return true;
    const haystack = searchText([product.name, product.brand, ...product.variants.flatMap((variant) => [variant.name, variant.sku, variant.attributes?.manufacturer_reference, variant.attributes?.source_gencode])].join(' '));
    return terms.every((term) => haystack.includes(term));
  });
}
