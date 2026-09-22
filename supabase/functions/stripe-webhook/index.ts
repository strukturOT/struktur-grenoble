import Stripe from 'npm:stripe@18.5.0';
import { adminClient } from '../_shared/supabase.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const stripe = new Stripe(stripeSecret, { httpClient: Stripe.createFetchHttpClient() });

interface AddressDetails {
  name?: string | null;
  phone?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    postal_code?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  } | null;
}

function addressJson(details: AddressDetails | null | undefined) {
  if (!details?.address) return null;
  return {
    full_name: details.name,
    line1: details.address.line1,
    line2: details.address.line2,
    postal_code: details.address.postal_code,
    city: details.address.city,
    state: details.address.state,
    country_code: details.address.country,
    phone: details.phone,
  };
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!stripeSecret || !webhookSecret) return new Response('Stripe is not configured', { status: 503 });

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Missing Stripe signature', { status: 400 });

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Invalid Stripe webhook signature', error);
    return new Response('Invalid signature', { status: 400 });
  }

  const admin = adminClient();
  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id ?? session.client_reference_id;
  if (!orderId) return new Response('Missing order reference', { status: 400 });

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      if (session.payment_status !== 'paid') return new Response('ok');

      const sessionWithDetails = await stripe.checkout.sessions.retrieve(session.id);
      const collected = (sessionWithDetails as unknown as {
        collected_information?: { shipping_details?: AddressDetails };
        shipping_details?: AddressDetails;
      });
      const shippingDetails = collected.collected_information?.shipping_details ?? collected.shipping_details;

      const { data, error } = await admin.rpc('complete_stripe_order', {
        p_order_id: orderId,
        p_checkout_session_id: session.id,
        p_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : '',
        p_email: sessionWithDetails.customer_details?.email ?? '',
        p_shipping_address: addressJson(shippingDetails),
        p_billing_address: addressJson(sessionWithDetails.customer_details),
      });
      if (error || data !== true) throw error ?? new Error('Order could not be completed');
    }

    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const { error } = await admin.rpc('release_stripe_order_reservation', {
        p_order_id: orderId,
        p_checkout_session_id: session.id,
      });
      if (error) throw error;
    }
  } catch (error) {
    console.error(`Stripe webhook ${event.id} failed`, error);
    return new Response('Webhook processing failed', { status: 500 });
  }

  return new Response('ok');
});
