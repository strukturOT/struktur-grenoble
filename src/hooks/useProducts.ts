import { useEffect, useState } from 'react';
import { getPublishedCategories, getPublishedProduct, getPublishedProducts, type StoreCategory, type StoreProduct } from '../lib/commerce';
import { isSupabaseConfigured } from '../lib/supabase';
import { catalogueSeed, mixProductBrands } from '../lib/productOrder';

interface ProductsState {
  products: StoreProduct[];
  loading: boolean;
  error: string | null;
}

export function useProducts({ limit, featured, order = 'newest', poolSize }: { limit?: number; featured?: boolean; order?: 'newest' | 'mixed'; poolSize?: number } = {}) {
  const [state, setState] = useState<ProductsState>({ products: [], loading: isSupabaseConfigured, error: null });

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) return undefined;

    getPublishedProducts({ limit: order === 'mixed' ? poolSize : limit, featured }).then(({ data, error }) => {
      if (!active) return;
      const ordered = order === 'mixed' ? mixProductBrands(data, catalogueSeed()) : data;
      setState({ products: limit ? ordered.slice(0, limit) : ordered, loading: false, error: error?.message ?? null });
    });

    return () => {
      active = false;
    };
  }, [featured, limit, order, poolSize]);

  return state;
}

export function useProduct(slug: string | undefined) {
  const [state, setState] = useState<{ product: StoreProduct | null; loading: boolean; error: string | null }>({
    product: null,
    loading: isSupabaseConfigured,
    error: null,
  });

  useEffect(() => {
    let active = true;
    if (!slug || !isSupabaseConfigured) return undefined;

    getPublishedProduct(slug).then(({ data, error }) => {
      if (!active) return;
      setState({ product: data, loading: false, error: error?.message ?? null });
    });

    return () => {
      active = false;
    };
  }, [slug]);

  return state;
}

export function useCategories() {
  const [state, setState] = useState<{ categories: StoreCategory[]; loading: boolean; error: string | null }>({ categories: [], loading: isSupabaseConfigured, error: null });

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) return undefined;
    getPublishedCategories().then(({ data, error }) => {
      if (!active) return;
      setState({ categories: data, loading: false, error: error?.message ?? null });
    });
    return () => { active = false; };
  }, []);

  return state;
}
