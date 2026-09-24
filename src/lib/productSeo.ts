import type { StoreProduct } from './commerce';
import { formatMoney, productPrice } from './commerce';

export interface ProductAnswer {
  question: string;
  answer: string;
}

const clean = (value: string | null | undefined) => value?.replace(/\s+/g, ' ').trim() || '';

export const productSeoDescription = (product: StoreProduct) => {
  const seoDescription = clean(product.seoDescription);
  if (seoDescription) return seoDescription.length > 160 ? `${seoDescription.slice(0, 157).trimEnd()}…` : seoDescription;
  const base = clean(product.description);
  if (base) return base.length > 155 ? `${base.slice(0, 152).trimEnd()}…` : base;
  const category = product.category?.name ? ` dans la catégorie ${product.category.name}` : '';
  return `${product.name}${product.brand ? ` par ${product.brand}` : ''}${category}, disponible chez STRUKTUR Grenoble.`;
};

export const productAnswers = (product: StoreProduct): ProductAnswer[] => {
  const available = product.variants.filter((variant) => variant.stockQuantity > 0);
  const namedVariants = product.variants.map((variant) => variant.name).filter((name): name is string => Boolean(name));
  const answers: ProductAnswer[] = [
    {
      question: `Quel est le prix de ${product.name} ?`,
      answer: `${product.name} est proposé à partir de ${formatMoney(productPrice(product), product.currency)}. Le prix affiché sur la fiche produit est mis à jour depuis le catalogue STRUKTUR.`,
    },
    {
      question: `Quelles variantes de ${product.name} sont disponibles ?`,
      answer: namedVariants.length > 0
        ? `Les variantes proposées sont : ${namedVariants.join(', ')}. ${available.length > 0 ? `Actuellement en stock : ${available.map((variant) => variant.name).filter(Boolean).join(', ') || `${available.length} option(s)`}.` : 'Aucune de ces variantes n’est actuellement en stock.'} La fiche produit indique le stock par option.`
        : 'Les options actuellement proposées sont affichées directement sur la fiche produit, avec leur disponibilité en temps réel.',
    },
    {
      question: `${product.name} est-il en stock ?`,
      answer: available.length > 0
        ? `${available.length} variante${available.length > 1 ? 's sont' : ' est'} actuellement indiquée${available.length > 1 ? 's' : ''} comme disponible. Le stock peut évoluer : vérifiez la sélection de taille avant l’ajout au panier.`
        : 'Aucune variante n’est actuellement indiquée comme disponible. La fiche sera automatiquement mise à jour lors du prochain réassort.',
    },
    {
      question: `Où découvrir ${product.name} ?`,
      answer: 'Retrouvez cette pièce dans la sélection en ligne STRUKTUR et au concept store, 45 rue Lesdiguières à Grenoble.',
    },
  ];
  return answers;
};

export const productJsonLd = (product: StoreProduct, siteUrl: string) => {
  const url = `${siteUrl}/produit/${product.slug}`;
  const offers = product.variants.length > 0 ? product.variants.map((variant) => ({
    '@type': 'Offer',
    url,
    sku: variant.sku,
    priceCurrency: product.currency,
    price: ((variant.priceCents ?? product.priceCents) / 100).toFixed(2),
    availability: variant.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'STRUKTUR Grenoble' },
  })) : [{
    '@type': 'Offer',
    url,
    priceCurrency: product.currency,
    price: (product.priceCents / 100).toFixed(2),
    availability: 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'STRUKTUR Grenoble' },
  }];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description: productSeoDescription(product),
    image: product.images.map((image) => image.imageUrl),
    sku: product.variants[0]?.sku,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    category: product.category?.name,
    offers,
  };
};

export const breadcrumbJsonLd = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
