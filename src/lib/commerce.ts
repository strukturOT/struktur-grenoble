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

export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  priceCents: number;
  currency: string;
  status: ProductStatus;
  featured: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  price_cents: number;
  currency: string;
  status: ProductStatus;
  featured: boolean;
  product_images?: Array<{ id: string; image_url: string; alt_text: string | null; position: number }>;
  product_variants?: Array<{ id: string; name: string | null; sku: string; price_cents: number | null; stock_quantity: number; position: number }>;
}

const productSelect = `
  id, name, slug, brand, description, price_cents, currency, status, featured,
  product_images (id, image_url, alt_text, position),
  product_variants (id, name, sku, price_cents, stock_quantity, position)
`;

const mapProduct = (row: ProductRow): StoreProduct => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  brand: row.brand,
  description: row.description,
  priceCents: row.price_cents,
  currency: row.currency,
  status: row.status,
  featured: row.featured,
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
    .order('created_at', { ascending: false });

  if (options.featured) query = query.eq('featured', true);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  return { data: ((data ?? []) as unknown as ProductRow[]).map(mapProduct), error };
}

export async function getPublishedProduct(slug: string) {
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
