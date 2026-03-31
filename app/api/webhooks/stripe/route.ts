/**
 * POST /api/webhooks/stripe — process Stripe webhook events.
 *
 * Verifies the Stripe-Signature header and drives order state transitions:
 *   checkout.session.completed    → PAYMENT_SUCCEEDED  (payment_pending → paid)
 *   payment_intent.payment_failed → PAYMENT_FAILED     (payment_pending → payment_failed)
 *
 * Returns 200 for all valid, verified requests — including unhandled event types —
 * so Stripe does not retry unnecessarily.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY       — Stripe secret key
 *   STRIPE_WEBHOOK_SECRET   — webhook signing secret from Stripe Dashboard
 */

import { NextRequest, NextResponse, after } from 'next/server';
import Stripe from 'stripe';
import { orderStore } from '@/lib/order/store';
import { processDomainForOrder } from '@/lib/porkbun/domain-service';
import { buildAndDeployOrder } from '@/lib/site/build-service';
import type { PaymentInfo } from '@/lib/order/types';

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!key || !webhookSecret) {
    console.error('[webhook/stripe] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhooks not configured' }, { status: 503 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Read raw body before any parsing — required for Stripe signature verification.
  const rawBody = await req.text();
  const stripe = new Stripe(key, { apiVersion: '2023-10-16' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook/stripe] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await handleEvent(stripe, event);
  } catch (err) {
    // Log but still return 200 — processing errors should not cause Stripe retries.
    console.error('[webhook/stripe] unhandled error for event', event.type, ':', err);
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(stripe: Stripe, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // client_reference_id is set to orderId when creating the Checkout Session.
      const orderId = session.client_reference_id ?? session.metadata?.orderId;
      if (!orderId) {
        console.warn('[webhook/stripe] checkout.session.completed has no orderId', session.id);
        return;
      }

      const order = await orderStore.findById(orderId);
      if (!order) {
        console.warn('[webhook/stripe] order not found', orderId, 'session', session.id);
        return;
      }

      const piId =
        typeof session.payment_intent === 'string' ? session.payment_intent : undefined;

      const paymentInfo: PaymentInfo = {
        // Preserve existing fields (stripeSessionId, amountCents) set during checkout creation.
        stripeSessionId: order.payment?.stripeSessionId ?? session.id,
        amountCents: order.payment?.amountCents ?? session.amount_total ?? 8900,
        ...(piId ? { stripePaymentIntentId: piId } : {}),
        paidAt: new Date().toISOString(),
      };

      const result = await orderStore.transition(orderId, {
        event: 'PAYMENT_SUCCEEDED',
        note: 'checkout.session.completed webhook',
        meta: {
          stripeSessionId: session.id,
          ...(piId ? { stripePaymentIntentId: piId } : {}),
        },
        patch: { payment: paymentInfo },
      });

      if (!result.ok && result.error !== 'IDEMPOTENT_SKIP') {
        console.error(
          '[webhook/stripe] PAYMENT_SUCCEEDED transition failed for order',
          orderId,
          result.error,
          result.detail
        );
      } else {
        console.log('[webhook/stripe] order', orderId, '→ paid');

        // Kick off domain acquisition after the response is sent.
        // after() keeps the function alive until the callback completes,
        // giving Stripe an immediate 200 while domain work runs in background.
        after(async () => {
          console.log('[webhook/stripe] starting domain processing for order', orderId);
          const domainResult = await processDomainForOrder(orderId);
          if (!domainResult.ok) {
            console.error(
              '[webhook/stripe] domain processing failed for order', orderId,
              '—', domainResult.error,
            );
            return;
          }

          console.log(
            '[webhook/stripe] domain processing complete for order', orderId,
            '— domain:', domainResult.domain,
            '— path:', domainResult.path,
          );

          // Domain secured — kick off site build & deploy pipeline.
          console.log('[webhook/stripe] starting site build for order', orderId);
          const buildResult = await buildAndDeployOrder(orderId);
          if (buildResult.ok) {
            console.log(
              '[webhook/stripe] site live for order', orderId,
              '—', buildResult.siteUrl,
            );
          } else {
            console.error(
              '[webhook/stripe] site build failed for order', orderId,
              `(phase=${buildResult.phase}):`, buildResult.error,
            );
          }
        });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;

      // Retrieve the Checkout Session that owns this PaymentIntent to get the orderId.
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: pi.id,
        limit: 1,
      });
      const session = sessions.data[0];
      const orderId = session?.client_reference_id ?? session?.metadata?.orderId;

      if (!orderId) {
        console.warn(
          '[webhook/stripe] payment_intent.payment_failed — could not resolve orderId for pi',
          pi.id
        );
        return;
      }

      const failureMessage = pi.last_payment_error?.message ?? 'Payment declined';

      const result = await orderStore.transition(orderId, {
        event: 'PAYMENT_FAILED',
        note: failureMessage,
        meta: { stripePaymentIntentId: pi.id },
      });

      if (!result.ok && result.error !== 'IDEMPOTENT_SKIP') {
        console.error(
          '[webhook/stripe] PAYMENT_FAILED transition failed for order',
          orderId,
          result.error,
          result.detail
        );
      } else {
        console.log('[webhook/stripe] order', orderId, '→ payment_failed');
      }
      break;
    }

    default:
      // Not an error — we simply don't act on other event types.
      break;
  }
}
