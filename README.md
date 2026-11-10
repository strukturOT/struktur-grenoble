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
4. In Authentication → URL Configuration, use the official Site URL `https://strukturkultur.fr` and redirect URL `https://strukturkultur.fr/**`. Add only exact local or owned preview origins when needed. Keep the existing email-confirmation/provider settings; the account screen handles either immediate sign-in or email confirmation.
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
  SITE_URL=https://strukturkultur.fr \
  STRIPE_SECRET_KEY=sk_live_replace_me \
  STRIPE_WEBHOOK_SECRET=whsec_replace_me
```

Choose the delivery fee later from **Admin → Livraison**. Saving explicitly writes `site_settings.shipping` as `{ "amount_cents": 0, "label": "Livraison standard" }` with the entered amount and label; merely opening the page never creates a setting. A zero amount means free delivery. Existing admin RLS restricts these changes to administrators.

The checkout function reads and validates that setting for every new checkout, and its read-only GET route returns the same fee for the basket/checkout totals. Invalid data or a failed settings read blocks a new payment. While the setting is absent, the legacy `STRIPE_SHIPPING_RATE_CENTS` and `STRIPE_SHIPPING_RATE_NAME` environment values remain the fallback; an absent amount defaults to `0`, preserving current free delivery. A pending reserved payment keeps its original delivery fee and total when resumed. Delivery remains France-only.

`SITE_URL` must match the official storefront origin `https://strukturkultur.fr`: it controls Checkout CORS and Stripe return URLs. Keep it aligned with the Auth Site URL and redirect allowlist.

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

Every production build generates `robots.txt`, canonical page/category/product sitemaps, `llms.txt`, a catalogue snapshot, and initial public HTML from Supabase. Product-guide pages canonicalize to their matching product instead of submitting duplicate product facts as separate articles. Product rows whose slug starts with `test-` are excluded. Admin, account, cart, and checkout routes are marked `noindex`.

Scoped Cloudflare Pages Functions serve `/produit/:slug`, `/categorie/:slug`, `/plan-du-site`, `/sitemap.xml`, `/sitemap-products.xml` and `/sitemap-categories.xml` from current public Supabase data. Publishing, archiving or editing a product in the admin updates these pages and sitemaps without a new Git deployment. Unknown/archived products return HTTP 404; catalogue outages return HTTP 503 with `Retry-After`, rather than a false 404 or an empty success page. Other pages, assets and private app routes retain static delivery. `public/_routes.json` keeps Function invocations restricted to these catalogue routes. The XML sitemaps are standard machine-readable XML; `/plan-du-site` is the searchable HTML directory for visitors and does not rely on browser XSLT support.

Run `npm run build` before using `wrangler pages dev dist`: the build produces the compiled app shell and `.seo/public-config.json` used by Functions. This generated file contains only the public Supabase origin, publishable/anon key and site/redirect policy already exposed by the browser application. Never add server credentials to it or replace its explicit public-field whitelist with an environment dump. Function code has no Node runtime dependencies and reads the catalogue anonymously under the public database policies.

Cloudflare Pages production builds from the configured `main` branch default to the official origin `https://strukturkultur.fr`, with indexing enabled. `VITE_SITE_URL` remains an optional HTTP(S) origin override. Every other Pages branch stays `noindex`, even if it inherits that variable, and uses its deployment URL for preview metadata. Local development is `noindex` unless an explicit origin is configured. The shared build-origin policy supplies Vite, generated SEO files, prerendered pages and browser metadata; browser navigation also keeps Pages-hosted aliases `noindex`. Generated SEO artifacts are ignored in Git because the build regenerates them for the current deployment and catalogue. Do not add a production-only env file as a substitute for this branch policy.
