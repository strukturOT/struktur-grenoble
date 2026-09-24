# Struktur Grenoble

React, TypeScript and Vite storefront for Struktur Grenoble. The catalogue, stock, customer accounts and administration are driven by Supabase; no product inventory is hard-coded in the application.

## Run locally

```bash
npm install
npm run dev
```

## Connect Supabase

1. Create a Supabase project.
2. Link the project and run `npx supabase db push` to apply every migration in order.
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

## Stripe Checkout

Payments use Stripe-hosted Checkout. Prices and stock are validated by the `create-checkout-session` Edge Function, inventory is reserved atomically in Postgres, and only the signed `stripe-webhook` can mark an order as paid.

Deploy the functions and configure their server-side secrets:

```bash
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase secrets set \
  SITE_URL=https://struktur-grenoble.fr \
  STRIPE_SECRET_KEY=sk_live_replace_me \
  STRIPE_WEBHOOK_SECRET=whsec_replace_me \
  STRIPE_SHIPPING_RATE_CENTS=690 \
  STRIPE_SHIPPING_RATE_NAME="Livraison standard"
```

`STRIPE_SHIPPING_RATE_CENTS` is optional and defaults to `0` (free delivery) until delivery pricing is finalized.

Create a Stripe webhook pointing to:

```text
https://<project-ref>.supabase.co/functions/v1/stripe-webhook
```

Subscribe it to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`. Never place `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or the Supabase service-role key in Cloudflare/Vite variables or commit them to Git.

## Commands

- `npm run dev` — start development server
- `npm run build` — type-check and create production build
- `npm run preview` — preview production build
- `npm run lint` — run Oxlint

## Search and AI discovery

Every production build generates `robots.txt`, an XML sitemap index with page, category, product, and product-guide maps, `llms.txt`, a full catalogue file, and an RSS feed from Supabase. The build paginates the active product catalogue and reads every category, including empty collections. Product rows whose slug starts with `test-` are deliberately excluded from SEO output. Admin, account, cart, and checkout routes are marked `noindex`.

Until the final domain is chosen, leave `VITE_SITE_URL` unset. Cloudflare Pages uses its deployment URL for canonical and sitemap links and applies `noindex` so temporary previews do not appear in search results. After choosing the domain, set `VITE_SITE_URL` in Cloudflare Pages to the exact HTTPS origin without a trailing slash (for example `https://shop.example.com`). That enables indexing and stable canonical URLs. Generated SEO artifacts are ignored in Git because the build regenerates them for the current deployment and catalogue.
