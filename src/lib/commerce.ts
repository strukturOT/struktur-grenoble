import { supabase } from './supabase';
import { optimizeProductImage } from './imageOptimization';

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface ProductVariant {
  id: string;
  name: string | null;
  sku: string;
  priceCents: number | null;
  stockQuantity: number;
  position: number;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  position: number;
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  storagePath: string | null;
  position: number;
  productCount: number;
}

export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  priceCents: number;
  currency: string;
  status: ProductStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  category: StoreCategory | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  price_cents: number;
  currency: string;
  status: ProductStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  categories?: { id: string; name: string; slug: string; description: string | null; image_url: string | null; storage_path: string | null; position: number } | null;
  product_images?: Array<{ id: string; image_url: string; alt_text: string | null; position: number }>;
  product_variants?: Array<{ id: string; name: string | null; sku: string; price_cents: number | null; stock_quantity: number; position: number }>;
}

const productSelect = `
  id, name, slug, brand, description, seo_title, seo_description, price_cents, currency, status, featured, category_id, created_at, updated_at,
  categories (id, name, slug, description, image_url, storage_path, position),
  product_images (id, image_url, alt_text, position),
  product_variants (id, name, sku, price_cents, stock_quantity, position)
`;

const mapProduct = (row: ProductRow): StoreProduct => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  brand: row.brand,
  description: row.description,
  seoTitle: row.seo_title,
  seoDescription: row.seo_description,
  priceCents: row.price_cents,
  currency: row.currency,
  status: row.status,
  featured: row.featured,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  category: row.categories ? {
    id: row.categories.id,
    name: row.categories.name,
    slug: row.categories.slug,
    description: row.categories.description,
    imageUrl: row.categories.image_url,
    storagePath: row.categories.storage_path,
    position: row.categories.position,
    productCount: 0,
  } : null,
  images: [...(row.product_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((image) => ({ id: image.id, imageUrl: image.image_url, altText: image.alt_text, position: image.position })),
  variants: [...(row.product_variants ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      priceCents: variant.price_cents,
      stockQuantity: variant.stock_quantity,
      position: variant.position,
    })),
});

export const formatMoney = (amountCents: number, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amountCents / 100);

export const productPrice = (product: StoreProduct) => {
  const prices = product.variants
    .map((variant) => variant.priceCents ?? product.priceCents)
    .filter((price) => Number.isFinite(price));

  return prices.length > 0 ? Math.min(...prices) : product.priceCents;
};

export const productImage = (product: StoreProduct) => product.images[0]?.imageUrl ?? null;

export async function getPublishedProducts(options: { limit?: number; featured?: boolean } = {}) {
  if (!supabase) return { data: [] as StoreProduct[], error: null };

  let query = supabase
    .from('products')
    .select(productSelect)
    .eq('status', 'active')
    .not('slug', 'like', 'test-%')
    .order('created_at', { ascending: false });

  if (options.featured) query = query.eq('featured', true);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  return { data: ((data ?? []) as unknown as ProductRow[]).map(mapProduct), error };
}

const mapCategory = (row: { id: string; name: string; slug: string; description: string | null; image_url: string | null; storage_path: string | null; position: number; products?: Array<{ id: string }> }): StoreCategory => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  imageUrl: row.image_url,
  storagePath: row.storage_path,
  position: row.position,
  productCount: row.products?.length ?? 0,
});

export async function getPublishedCategories() {
  if (!supabase) return { data: [] as StoreCategory[], error: null };
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_url, storage_path, position, products!inner(id)')
    .order('position', { ascending: true })
    .order('name', { ascending: true });
  return { data: ((data ?? []) as unknown as Array<Parameters<typeof mapCategory>[0]>).map(mapCategory), error };
}

export async function getPublishedProduct(slug: string) {
  if (slug.toLowerCase().startsWith('test-')) return { data: null as StoreProduct | null, error: null };
  if (!supabase) return { data: null as StoreProduct | null, error: null };

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('status', 'active')
    .eq('slug', slug)
    .maybeSingle();

  return { data: data ? mapProduct(data as unknown as ProductRow) : null, error };
}

export interface NewProductInput {
  name: string;
  slug: string;
  brand: string;
  description: string;
  priceCents: number;
  currency: string;
  variants: Array<{
    id?: string;
    name: string;
    sku: string;
    priceCents: number | null;
    stockQuantity: number;
  }>;
  status: ProductStatus;
  featured: boolean;
  categoryId: string | null;
}

export async function createProduct(input: NewProductInput, imageFile?: File | null) {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const optimizedImage = imageFile ? await optimizeProductImage(imageFile) : null;

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name: input.name,
      slug: input.slug,
      brand: input.brand || null,
      description: input.description || null,
      price_cents: input.priceCents,
      currency: input.currency.toUpperCase(),
      status: input.status,
      featured: input.featured,
      category_id: input.categoryId,
    })
    .select('id')
    .single();

  if (productError || !product) throw productError ?? new Error('Impossible de créer le produit.');

  const { error: variantError } = await supabase.from('product_variants').insert(
    input.variants.map((variant, position) => ({
      product_id: product.id,
      name: variant.name || null,
      sku: variant.sku,
      price_cents: variant.priceCents ?? input.priceCents,
      stock_quantity: variant.stockQuantity,
      position,
    })),
  );
  if (variantError) throw variantError;

  if (optimizedImage) {
    const extension = optimizedImage.name.split('.').pop()?.toLowerCase() || 'webp';
    const filePath = `${product.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, optimizedImage, {
      contentType: optimizedImage.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(filePath);
    const { error: imageError } = await supabase.from('product_images').insert({
      product_id: product.id,
      image_url: publicUrl.publicUrl,
      storage_path: filePath,
      alt_text: input.name,
      position: 0,
    });
    if (imageError) throw imageError;
  }

  return product.id;
}

/** Update the editable catalogue fields and retain every existing variant unless it is changed. */
export async function updateProduct(productId: string, input: NewProductInput, imageFile?: File | null) {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const optimizedImage = imageFile ? await optimizeProductImage(imageFile) : null;

  const { error: productError } = await supabase
    .from('products')
    .update({
      name: input.name,
      slug: input.slug,
      brand: input.brand || null,
      description: input.description || null,
      price_cents: input.priceCents,
      currency: input.currency.toUpperCase(),
      status: input.status,
      featured: input.featured,
      category_id: input.categoryId,
    })
    .eq('id', productId);
  if (productError) throw productError;

  for (const [position, variant] of input.variants.entries()) {
    const values = {
      name: variant.name || null,
      sku: variant.sku,
      price_cents: variant.priceCents ?? input.priceCents,
      stock_quantity: variant.stockQuantity,
      position,
    };
    const { error } = variant.id
      ? await supabase.from('product_variants').update(values).eq('id', variant.id).eq('product_id', productId)
      : await supabase.from('product_variants').insert({ ...values, product_id: productId });
    if (error) throw error;
  }

  if (optimizedImage) {
    const extension = optimizedImage.name.split('.').pop()?.toLowerCase() || 'webp';
    const filePath = `${productId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, optimizedImage, {
      contentType: optimizedImage.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(filePath);
    const { data: lastImage } = await supabase
      .from('product_images')
      .select('position')
      .eq('product_id', productId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error: imageError } = await supabase.from('product_images').insert({
      product_id: productId,
      image_url: publicUrl.publicUrl,
      storage_path: filePath,
      alt_text: input.name,
      position: (lastImage?.position ?? -1) + 1,
    });
    if (imageError) throw imageError;
  }
}

export async function getAdminProducts() {
  if (!supabase) return { data: [] as StoreProduct[], error: null };
  const { data, error } = await supabase.from('products').select(productSelect).order('updated_at', { ascending: false });
  return { data: ((data ?? []) as unknown as ProductRow[]).map(mapProduct), error };
}

export interface NewCategoryInput {
  name: string;
  slug: string;
  description: string;
  position: number;
}

export async function getAdminCategories() {
  if (!supabase) return { data: [] as StoreCategory[], error: null };
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_url, storage_path, position, products(id)')
    .order('position', { ascending: true })
    .order('name', { ascending: true });
  return { data: ((data ?? []) as unknown as Array<Parameters<typeof mapCategory>[0]>).map(mapCategory), error };
}

async function uploadCategoryImage(categoryId: string, file: File) {
  const optimizedImage = await optimizeProductImage(file);
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const extension = optimizedImage.name.split('.').pop()?.toLowerCase() || 'webp';
  const storagePath = `${categoryId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from('category-images').upload(storagePath, optimizedImage, { contentType: optimizedImage.type, upsert: false });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('category-images').getPublicUrl(storagePath);
  return { imageUrl: data.publicUrl, storagePath };
}

export async function createCategory(input: NewCategoryInput, imageFile?: File | null) {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { data: category, error } = await supabase.from('categories').insert({ name: input.name, slug: input.slug, description: input.description || null, position: input.position }).select('id').single();
  if (error || !category) throw error ?? new Error('Impossible de créer la catégorie.');
  if (imageFile) {
    const media = await uploadCategoryImage(category.id, imageFile);
    const { error: imageError } = await supabase.from('categories').update(media).eq('id', category.id);
    if (imageError) throw imageError;
  }
  return category.id;
}

export async function updateCategory(categoryId: string, input: NewCategoryInput, imageFile?: File | null, previousStoragePath?: string | null) {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { error } = await supabase.from('categories').update({ name: input.name, slug: input.slug, description: input.description || null, position: input.position }).eq('id', categoryId);
  if (error) throw error;
  if (imageFile) {
    const media = await uploadCategoryImage(categoryId, imageFile);
    const { error: imageError } = await supabase.from('categories').update(media).eq('id', categoryId);
    if (imageError) throw imageError;
    if (previousStoragePath) await supabase.storage.from('category-images').remove([previousStoragePath]);
  }
}

export async function deleteCategory(category: StoreCategory) {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { error } = await supabase.from('categories').delete().eq('id', category.id);
  if (error) throw error;
  if (category.storagePath) await supabase.storage.from('category-images').remove([category.storagePath]);
}

export async function updateProductStatus(productId: string, status: ProductStatus) {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { error } = await supabase.from('products').update({ status }).eq('id', productId);
  if (error) throw error;
}

export interface StoreCustomer {
  id: string;
  fullName: string | null;
  email: string | null;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  userId: string | null;
  fullName: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'closed';
  createdAt: string;
}

export async function getAdminCustomers() {
  if (!supabase) return { data: [] as StoreCustomer[], error: null };
  const { data, error } = await supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false });
  return {
    data: (data ?? []).map((profile) => ({
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role as StoreCustomer['role'],
      createdAt: profile.created_at,
    })),
    error,
  };
}

export async function updateCustomerRole(customerId: string, role: StoreCustomer['role']) {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { error } = await supabase.from('profiles').update({ role }).eq('id', customerId);
  if (error) throw error;
}

export async function getAdminMessages() {
  if (!supabase) return { data: [] as ContactMessage[], error: null };
  const { data, error } = await supabase.from('contact_messages').select('id, user_id, full_name, email, message, status, created_at').order('created_at', { ascending: false }).limit(100);
  return {
    data: (data ?? []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      fullName: item.full_name,
      email: item.email,
      message: item.message,
      status: item.status as ContactMessage['status'],
      createdAt: item.created_at,
    })),
    error,
  };
}

export async function updateMessageStatus(messageId: string, status: ContactMessage['status']) {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', messageId);
  if (error) throw error;
}

export async function sendContactMessage(input: { fullName: string; email: string; message: string; userId?: string | null }) {
  if (!supabase) throw new Error('La messagerie est momentanément indisponible.');
  const { error } = await supabase.from('contact_messages').insert({
    full_name: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    message: input.message.trim(),
    user_id: input.userId ?? null,
  });
  if (error) throw error;
}

export interface StoreOrder {
  id: string;
  userId: string;
  orderNumber: number;
  status: string;
  paymentStatus: string;
  totalCents: number;
  currency: string;
  createdAt: string;
}

const mapOrder = (row: { id: string; user_id: string; order_number: number; status: string; payment_status: string; total_cents: number; currency: string; created_at: string }): StoreOrder => ({
  id: row.id,
  userId: row.user_id,
  orderNumber: row.order_number,
  status: row.status,
  paymentStatus: row.payment_status,
  totalCents: row.total_cents,
  currency: row.currency,
  createdAt: row.created_at,
});

export async function getCustomerOrders() {
  if (!supabase) return { data: [] as StoreOrder[], error: null };
  const { data, error } = await supabase.from('orders').select('id, user_id, order_number, status, payment_status, total_cents, currency, created_at').order('created_at', { ascending: false });
  return { data: ((data ?? []) as Array<Parameters<typeof mapOrder>[0]>).map(mapOrder), error };
}

export async function getAdminOrders() {
  if (!supabase) return { data: [] as StoreOrder[], error: null };
  const { data, error } = await supabase.from('orders').select('id, user_id, order_number, status, payment_status, total_cents, currency, created_at').order('created_at', { ascending: false }).limit(20);
  return { data: ((data ?? []) as Array<Parameters<typeof mapOrder>[0]>).map(mapOrder), error };
}

export async function startStripeCheckout(
  lines: Array<{ variantId: string; quantity: number }>,
  checkoutKey: string,
) {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { lines, checkoutKey },
  });
  if (error) {
    let message = error.message;
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const payload = await context.clone().json() as { error?: string };
        if (payload.error) message = payload.error;
      } catch {
        // Keep the original invocation error when the response is not JSON.
      }
    }
    throw new Error(message);
  }
  if (!data?.url) throw new Error('Impossible d’ouvrir la page de paiement.');
  return data as { url: string; orderId: string };
}

export async function getCheckoutOrderBySession(sessionId: string) {
  if (!supabase) return { data: null as StoreOrder | null, error: new Error('Supabase n’est pas configuré.') };
  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id, order_number, status, payment_status, total_cents, currency, created_at')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();
  return { data: data ? mapOrder(data as Parameters<typeof mapOrder>[0]) : null, error };
}
