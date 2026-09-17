# Struktur Grenoble

React, TypeScript and Vite storefront for Struktur Grenoble. The catalogue, stock, customer accounts and administration are driven by Supabase; no product inventory is hard-coded in the application.

## Run locally

```bash
npm install
npm run dev
```

## Connect Supabase

1. Create a Supabase project.
2. Run [001_commerce_foundation.sql](supabase/migrations/001_commerce_foundation.sql) in the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local` and add the project URL and **publishable** key.
4. In Authentication → URL Configuration, add your local and production URLs as redirect URLs.
5. Sign up with the account that will administer the shop, then promote that profile in SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = '<the-auth-user-uuid>';
```

6. Start the site and visit `/admin` to create your real products, stock, variants and images.

Do not put a Supabase `secret`/`service_role` key in Vite environment variables. The browser only uses the public key; Row Level Security controls what it can access.

## Routes

- `/boutique` — live catalogue of published products
- `/produit/:slug` — live product details, variant stock and cart action
- `/panier` — persistent client-side cart
- `/compte` — Supabase authentication and customer order history
- `/admin` — role-protected product and order administration

## Data model and security

The migration creates profiles, categories, products, variants, product images, carts, addresses, orders, order items, settings and the `product-images` Storage bucket. It enables Row Level Security on every exposed table.

- Visitors can read only active products and their images/variants.
- Customers can access only their own profile, addresses, cart and orders.
- Only users whose `profiles.role` is `admin` can manage catalogue content, images, stock and orders.
- Orders cannot be inserted from the browser. A verified payment webhook must create/mark an order as paid on the server.

## Important payment decision

The checkout route is intentionally non-charging until a payment provider is chosen and configured. Payment capture, tax, delivery zones, returns policy and stock reservation must be implemented server-side with provider webhooks; implementing those in the browser would be unsafe and could create unpaid or duplicated orders.

Once you choose the payment provider (for example Stripe), add its secret key only to a Supabase Edge Function or another trusted server environment—never to this app.

## Commands

- `npm run dev` — start development server
- `npm run build` — type-check and create production build
- `npm run preview` — preview production build
- `npm run lint` — run Oxlint
