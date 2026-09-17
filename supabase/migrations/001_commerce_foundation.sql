-- Struktur Grenoble commerce foundation
-- Apply this migration in a new Supabase project before configuring the frontend.

create extension if not exists pgcrypto;

create type public.user_role as enum ('customer', 'admin');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.order_status as enum ('pending_payment', 'paid', 'processing', 'fulfilled', 'cancelled', 'refunded');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  brand text,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency char(3) not null default 'EUR' check (currency = upper(currency)),
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text,
  sku text not null unique,
  price_cents integer check (price_cents >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  attributes jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text unique,
  image_url text not null,
  alt_text text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_variant_id)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  line1 text not null,
  line2 text,
  postal_code text not null,
  city text not null,
  country_code char(2) not null default 'FR',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_default_address_per_user on public.addresses(user_id) where is_default;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  email text not null,
  status public.order_status not null default 'pending_payment',
  payment_status public.payment_status not null default 'pending',
  currency char(3) not null default 'EUR',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  shipping_address jsonb not null,
  billing_address jsonb,
  payment_provider text,
  payment_reference text unique,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_cents = subtotal_cents + shipping_cents + tax_cents)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  sku text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create index products_public_listing_idx on public.products(status, featured, created_at desc);
create index variants_product_idx on public.product_variants(product_id, position);
create index images_product_idx on public.product_images(product_id, position);
create index orders_user_idx on public.orders(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
create trigger carts_set_updated_at before update on public.carts for each row execute function public.set_updated_at();
create trigger cart_items_set_updated_at before update on public.cart_items for each row execute function public.set_updated_at();
create trigger addresses_set_updated_at before update on public.addresses for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an administrator can change a user role';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_settings enable row level security;

revoke all on table public.profiles, public.categories, public.products, public.product_variants, public.product_images, public.carts, public.cart_items, public.addresses, public.orders, public.order_items, public.site_settings from anon, authenticated;
grant select on public.products, public.product_variants, public.product_images, public.categories, public.site_settings to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.carts, public.cart_items, public.addresses to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant all on public.categories, public.products, public.product_variants, public.product_images, public.orders, public.order_items, public.site_settings to authenticated;

create policy "profiles are private" on public.profiles for select to authenticated using ((select auth.uid()) = id or (select public.is_admin()));
create policy "customers update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "admins update profiles" on public.profiles for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "published categories readable" on public.categories for select to anon, authenticated using (true);
create policy "admins manage categories" on public.categories for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "published products readable" on public.products for select to anon, authenticated using (status = 'active' or (select public.is_admin()));
create policy "admins manage products" on public.products for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "variants of published products readable" on public.product_variants for select to anon, authenticated using (exists (select 1 from public.products where products.id = product_variants.product_id and (products.status = 'active' or (select public.is_admin()))));
create policy "admins manage variants" on public.product_variants for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "images of published products readable" on public.product_images for select to anon, authenticated using (exists (select 1 from public.products where products.id = product_images.product_id and (products.status = 'active' or (select public.is_admin()))));
create policy "admins manage images" on public.product_images for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "customers manage own cart" on public.carts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "customers manage own cart items" on public.cart_items for all to authenticated using (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = auth.uid())) with check (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = auth.uid()));
create policy "customers manage own addresses" on public.addresses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "customers read own orders" on public.orders for select to authenticated using ((select auth.uid()) = user_id or (select public.is_admin()));
create policy "admins manage orders" on public.orders for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "customers read own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders where orders.id = order_items.order_id and (orders.user_id = auth.uid() or (select public.is_admin()))));
create policy "admins manage order items" on public.order_items for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "public settings readable" on public.site_settings for select to anon, authenticated using (true);
create policy "admins manage settings" on public.site_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
create policy "product images are publicly readable" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admins update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and (select public.is_admin())) with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));

-- After the first admin user signs up, promote only that user in SQL Editor:
-- update public.profiles set role = 'admin' where id = '<their auth user UUID>';
-- Never expose a Supabase secret/service key in this Vite client.
