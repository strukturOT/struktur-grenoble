import Stripe from 'npm:stripe@18.5.0';
import { corsHeaders, jsonResponse, safeError } from '../_shared/http.ts';
import { adminClient, userClient } from '../_shared/supabase.ts';

interface CheckoutLineInput {
  variantId: string;
  quantity: number;
}

interface CheckoutRequest {
  checkoutKey?: string;
  lines?: CheckoutLineInput[];
}

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const stripe = new Stripe(stripeSecret, { httpClient: Stripe.createFetchHttpClient() });

function optionalInteger(name: string) {
  const value = Deno.env.get(name);
  if (!value) return 0;
  if (!value || !/^\d+$/.test(value)) throw new Error(`Configuration manquante ou invalide: ${name}`);
  return Number(value);
}

function siteUrl() {
  const value = Deno.env.get('SITE_URL');
  if (!value) throw new Error('Configuration manquante: SITE_URL');
  const parsed = new URL(value);
  return parsed.origin;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Méthode non autorisée.' }, 405);

  let orderId: string | null = null;
  let createdSessionId: string | null = null;
  let createdOrder = false;
  const admin = adminClient();

  try {
    if (!stripeSecret) throw new Error('Configuration manquante: STRIPE_SECRET_KEY');

    const authorization = request.headers.get('authorization');
    if (!authorization) return jsonResponse(request, { error: 'Connexion requise.' }, 401);

    const { data: { user }, error: authError } = await userClient(authorization).auth.getUser();
    if (authError || !user?.email) return jsonResponse(request, { error: 'Session invalide. Reconnectez-vous.' }, 401);

    const body = await request.json() as CheckoutRequest;
    if (!body.checkoutKey || !Array.isArray(body.lines) || body.lines.length === 0) {
      return jsonResponse(request, { error: 'Votre panier est invalide.' }, 400);
    }

    const shippingCents = optionalInteger('STRIPE_SHIPPING_RATE_CENTS');
    const shippingName = Deno.env.get('STRIPE_SHIPPING_RATE_NAME')?.trim() || 'Livraison standard';

    const rpcLines = body.lines.map((line) => ({
      variant_id: line.variantId,
      quantity: line.quantity,
    }));

    const { data: orderResult, error: orderError } = await admin.rpc('create_pending_stripe_order', {
      p_user_id: user.id,
      p_checkout_key: body.checkoutKey,
      p_email: user.email,
      p_lines: rpcLines,
      p_shipping_cents: shippingCents,
      p_currency: 'EUR',
    });
    const result = orderResult as { order_id?: string; created?: boolean } | null;
    if (orderError || !result?.order_id) throw orderError ?? new Error('Impossible de préparer la commande.');
    orderId = result.order_id;
    createdOrder = result.created === true;

    const { data: order, error: fetchError } = await admin
      .from('orders')
      .select('id, order_number, currency, shipping_cents, stripe_checkout_url, order_items(product_name, variant_name, unit_price_cents, quantity)')
      .eq('id', orderId)
      .single();
    if (fetchError || !order) throw fetchError ?? new Error('Commande introuvable.');

    if (order.stripe_checkout_url) {
      return jsonResponse(request, { url: order.stripe_checkout_url, orderId: order.id });
    }

    const items = (order.order_items ?? []) as Array<{
      product_name: string;
      variant_name: string | null;
      unit_price_cents: number;
      quantity: number;
    }>;
    if (items.length === 0) throw new Error('La commande ne contient aucun article.');

    const origin = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'fr',
      customer_email: user.email,
      client_reference_id: order.id,
      metadata: { order_id: order.id, user_id: user.id, order_number: String(order.order_number) },
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: order.currency.toLowerCase(),
          unit_amount: item.unit_price_cents,
          tax_behavior: 'inclusive',
          product_data: {
            name: item.product_name,
            ...(item.variant_name ? { description: item.variant_name } : {}),
          },
        },
      })),
      shipping_address_collection: { allowed_countries: ['FR'] },
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: shippingName,
          fixed_amount: { amount: order.shipping_cents, currency: order.currency.toLowerCase() },
          tax_behavior: 'inclusive',
        },
      }],
      phone_number_collection: { enabled: true },
      billing_address_collection: 'auto',
      success_url: `${origin}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/panier?paiement=annule`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    }, { idempotencyKey: order.id });
    createdSessionId = session.id;

    if (!session.url) throw new Error('Stripe n’a pas retourné de page de paiement.');

    const { error: saveError } = await admin
      .from('orders')
      .update({ stripe_checkout_session_id: session.id, stripe_checkout_url: session.url })
      .eq('id', order.id)
      .eq('payment_status', 'pending');
    if (saveError) throw saveError;

    return jsonResponse(request, { url: session.url, orderId: order.id });
  } catch (error) {
    console.error('create-checkout-session', error);
    if (createdSessionId) {
      try { await stripe.checkout.sessions.expire(createdSessionId); } catch (expireError) {
        console.error('Unable to expire Stripe session', expireError);
      }
    }
    if (orderId && (createdOrder || createdSessionId)) {
      const { error: releaseError } = await admin.rpc('release_stripe_order_reservation', {
        p_order_id: orderId,
        p_checkout_session_id: null,
      });
      if (releaseError) console.error('Unable to release stock', releaseError);
    }
    return jsonResponse(request, { error: safeError(error) }, 400);
  }
});
