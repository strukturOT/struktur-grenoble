import { useEffect, useState } from 'react';
import { getPublishedProduct, getPublishedProducts, type StoreProduct } from '../lib/commerce';
import { isSupabaseConfigured } from '../lib/supabase';

interface ProductsState {
  products: StoreProduct[];
  loading: boolean;
  error: string | null;
}

export function useProducts({ limit, featured }: { limit?: number; featured?: boolean } = {}) {
  const [state, setState] = useState<ProductsState>({ products: [], loading: isSupabaseConfigured, error: null });

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) return undefined;

    getPublishedProducts({ limit, featured }).then(({ data, error }) => {
      if (!active) return;
      setState({ products: data, loading: false, error: error?.message ?? null });
    });

    return () => {
      active = false;
    };
  }, [featured, limit]);

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
