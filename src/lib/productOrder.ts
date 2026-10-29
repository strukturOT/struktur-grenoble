import type { StoreProduct } from './commerce';

export function catalogueSeed(): string {
  const fallback = 'struktur-selection';
  if (typeof window === 'undefined') return fallback;
  try {
    const existing = window.sessionStorage.getItem('struktur-catalogue-seed');
    if (existing) return existing;
    const seed = window.crypto.randomUUID();
    window.sessionStorage.setItem('struktur-catalogue-seed', seed);
    return seed;
  } catch {
    return fallback;
  }
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  }
  return result >>> 0;
}

// Shuffle within each brand, then spread brands evenly without losing products.
// A session seed keeps filtering and returning to the shop visually stable.
export function mixProductBrands(products: StoreProduct[], seed: string): StoreProduct[] {
  const brands = new Map<string, StoreProduct[]>();
  for (const product of products) {
    const key = product.brand?.trim().toLocaleLowerCase('fr') || 'struktur';
    const items = brands.get(key) || [];
    items.push(product);
    brands.set(key, items);
  }
  const groups = [...brands.entries()].map(([brand, items]) => ({
    brand,
    items: [...items].sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`)),
    tie: hash(`${seed}:${brand}`),
    index: 0,
  }));
  const mixed: StoreProduct[] = [];
  let previousBrand = '';
  while (mixed.length < products.length) {
    const available = groups
      .filter((group) => group.index < group.items.length)
      .sort((a, b) => a.index / a.items.length - b.index / b.items.length || a.tie - b.tie);
    const next = available.find((group) => group.brand !== previousBrand) || available[0];
    if (!next) break;
    mixed.push(next.items[next.index]);
    next.index += 1;
    previousBrand = next.brand;
  }
  return mixed;
}
