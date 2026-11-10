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
4. In Authentication → URL Configuration, set Site URL to the currently deployed storefront and allow its redirects. While the shop is on Cloudflare Pages, use `https://struktur-grenoble.pages.dev` with redirect URL `https://struktur-grenoble.pages.dev/**`. Add only exact local or owned production origins when needed. Keep the existing email-confirmation/provider settings; the account screen handles either immediate sign-in or email confirmation.
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
- `/admin/livraison` — admin-only delivery fee and label, in EUR including tax

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
  SITE_URL=https://struktur-grenoble.pages.dev \
  STRIPE_SECRET_KEY=sk_live_replace_me \
  STRIPE_WEBHOOK_SECRET=whsec_replace_me
```

Choose the delivery fee later from **Admin → Livraison**. Saving explicitly writes `site_settings.shipping` as `{ "amount_cents": 0, "label": "Livraison standard" }` with the entered amount and label; merely opening the page never creates a setting. A zero amount means free delivery. Existing admin RLS restricts these changes to administrators.

The checkout function reads and validates that setting for every new checkout, and its read-only GET route returns the same fee for the basket/checkout totals. Invalid data or a failed settings read blocks a new payment. While the setting is absent, the legacy `STRIPE_SHIPPING_RATE_CENTS` and `STRIPE_SHIPPING_RATE_NAME` environment values remain the fallback; an absent amount defaults to `0`, preserving current free delivery. A pending reserved payment keeps its original delivery fee and total when resumed. Delivery remains France-only.

`SITE_URL` must match the actual storefront origin: it controls Checkout CORS and Stripe return URLs. Align it and the Auth Site URL/redirect allowlist when the final domain is connected; do not use a future domain before it serves the shop.

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
