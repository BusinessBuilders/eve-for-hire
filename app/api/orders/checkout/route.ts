/**
 * POST /api/orders/checkout — create a $89 Basic-tier order and Stripe Checkout Session.
 *
 * Creates (or retrieves) an order, advances it to payment_pending, and returns a
 * Stripe-hosted Checkout URL. The caller should redirect the customer to that URL.
 *
 * Body:
 *   customerEmail   string          — required
 *   customerName    string          — optional display name
 *   idempotencyKey  string (≥8)     — optional; callers supply for dedup across retries
 *   requirements    object          — required; persisted so domain service can act on payment
 *     .businessName   string        — business / site name
 *     .description    string        — what the site should do
 *     .desiredDomain  string        — required; domain the customer wants (e.g. "mybiz.com")
 *     .colors         string        — optional colour/style preferences
 *     .sections       string[]      — optional list of page sections wanted
 *
 * Response: { url: string, orderId: string }
 *         | { orderId: string, redirectTo: string }   (order already has a live session)
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { orderStore } from '@/lib/order/store';
import type { PaymentInfo, OrderRequirements } from '@/lib/order/types';

const BASIC_TIER_CENTS = 8900; // $89.00

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { customerEmail, customerName, idempotencyKey, requirements } = body as Record<string, unknown>;

  if (typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
    return NextResponse.json(
      { error: 'customerEmail is required and must be a valid email' },
      { status: 400 }
    );
  }

  // Validate requirements — desiredDomain is the minimum required for the domain service.
  const reqs = typeof requirements === 'object' && requirements !== null
    ? (requirements as Record<string, unknown>)
    : null;

  const desiredDomain =
    typeof reqs?.desiredDomain === 'string' ? reqs.desiredDomain.trim() : null;

  if (!desiredDomain) {
    return NextResponse.json(
      { error: 'requirements.desiredDomain is required' },
      { status: 400 }
    );
  }

  const sections = Array.isArray(reqs?.sections)
    ? (reqs.sections as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];

  const styleHints = [
    typeof reqs?.colors === 'string' ? `Colors: ${reqs.colors}` : '',
    sections.length > 0 ? `Sections: ${sections.join(', ')}` : '',
  ].filter(Boolean).join('; ');

  const orderRequirements: OrderRequirements = {
    businessType: typeof reqs?.businessName === 'string' && reqs.businessName ? reqs.businessName : 'General',
    purpose: typeof reqs?.description === 'string' && reqs.description ? reqs.description : '',
    desiredDomain,
    domainPath: 'new',
    ...(styleHints ? { style: styleHints } : {}),
  };

  // Callers may supply a stable idempotency key (e.g. derived from chat session ID).
  // If omitted we generate a one-time key; the caller won't get dedup across retries.
  const iKey =
    typeof idempotencyKey === 'string' && idempotencyKey.length >= 8
      ? idempotencyKey
      : `order-${customerEmail}-${Date.now()}`;

  const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? `https://${req.headers.get('host')}`;

  // Create or retrieve order (idempotent on iKey).
  const order = await orderStore.create({
    customerEmail,
    idempotencyKey: iKey,
    ...(typeof customerName === 'string' ? { customerName } : {}),
  });

  // If a Stripe session already exists on this order, try to reuse it.
  if (order.payment?.stripeSessionId) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(order.payment.stripeSessionId);
      if (existing.url && existing.status === 'open') {
        return NextResponse.json({ url: existing.url, orderId: order.id });
      }
    } catch {
      // Session no longer retrievable — fall through to order-status redirect.
    }
    // Session is completed or expired; send to order status page.
    return NextResponse.json({ orderId: order.id, redirectTo: `/order/${order.id}` });
  }

  // Create a new Stripe Checkout Session.
  // Use client_reference_id so the webhook can resolve the order without a DB lookup.
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        client_reference_id: order.id,
        customer_email: customerEmail,
        // Embed orderId in the PaymentIntent metadata so payment_intent.succeeded
        // and payment_intent.payment_failed webhooks can resolve the order directly
        // without a secondary Stripe API call.
        payment_intent_data: {
          metadata: { orderId: order.id },
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: BASIC_TIER_CENTS,
              product_data: {
                name: 'Eve Basic Website — $89',
                description: 'AI-built website + domain + 1-year hosting. Live in minutes.',
                images: [`${baseUrl}/eve_face_card.png`],
              },
            },
          },
        ],
        success_url: `${baseUrl}/order/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/#hire`,
        metadata: { orderId: order.id },
      },
      // Idempotency key on the Stripe call prevents duplicate sessions on retries.
      { idempotencyKey: `checkout-${order.idempotencyKey}` }
    );
  } catch (err) {
    const message =
      err instanceof Stripe.errors.StripeError ? err.message : 'Checkout session creation failed';
    console.error('[orders/checkout] Stripe error:', err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!session.url) {
    return NextResponse.json({ error: 'No checkout URL returned by Stripe' }, { status: 502 });
  }

  // Advance order: new → qualifying → payment_pending.
  // The session ID is attached at the REQUIREMENTS_READY step so it travels with the order.
  await orderStore.transition(order.id, { event: 'START_QUALIFYING' });

  const paymentInfo: PaymentInfo = {
    stripeSessionId: session.id,
    amountCents: BASIC_TIER_CENTS,
  };
  await orderStore.transition(order.id, {
    event: 'REQUIREMENTS_READY',
    patch: { payment: paymentInfo, requirements: orderRequirements },
    meta: { stripeSessionId: session.id, desiredDomain: orderRequirements.desiredDomain },
  });

  return NextResponse.json({ url: session.url, orderId: order.id });
}
