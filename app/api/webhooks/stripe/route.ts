/**
 * POST /api/webhooks/stripe — process Stripe webhook events.
 *
 * Verifies the Stripe-Signature header and drives order state transitions:
 *   checkout.session.completed     → PAYMENT_SUCCEEDED  (works for both payment + subscription)
 *   payment_intent.succeeded       → PAYMENT_SUCCEEDED  (idempotent fallback for one-time payments)
 *   payment_intent.payment_failed  → PAYMENT_FAILED     (payment_pending → payment_failed)
 *
 * checkout.session.completed is the primary payment gate for subscription checkouts —
 * orderId comes from session.metadata.orderId which is set at session creation.
 * payment_intent.succeeded is kept as a fallback for legacy one-time payments.
 * Both handlers are idempotent (IDEMPOTENT_SKIP from orderStore prevents double-processing).
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
import { triggerPaperclipBuild } from '@/lib/site/paperclip-trigger';
import { trackFunnelEvent } from '@/lib/analytics/events';
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

async function handleEvent(_stripe: Stripe, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    // Primary handler for subscription checkouts. Also fires for one-time payments.
    // Uses session.metadata.orderId — set at Checkout Session creation.
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only process confirmed payments (skip free trials, pending async payments, etc.)
      if (session.payment_status !== 'paid') {
        console.log('[webhook/stripe] checkout.session.completed skipped — payment_status:', session.payment_status);
        break;
      }

      const orderId = session.metadata?.orderId;
      if (!orderId) {
        console.warn('[webhook/stripe] checkout.session.completed has no orderId in metadata', session.id);
        break;
      }

      const order = await orderStore.findById(orderId);
      if (!order) {
        console.warn('[webhook/stripe] order not found', orderId, 'session', session.id);
        break;
      }

      const paymentInfo: PaymentInfo = {
        stripeSessionId: session.id,
        amountCents: order.payment?.amountCents ?? (session.amount_total ?? 8900),
        paidAt: new Date().toISOString(),
      };

      const result = await orderStore.transition(orderId, {
        event: 'PAYMENT_SUCCEEDED',
        note: 'checkout.session.completed webhook',
        meta: { stripeSessionId: session.id },
        patch: { payment: paymentInfo },
      });

      if (!result.ok && result.error !== 'IDEMPOTENT_SKIP') {
        console.error(
          '[webhook/stripe] PAYMENT_SUCCEEDED transition failed for order',
          orderId,
          result.error,
          result.detail
        );
      } else if (result.ok) {
        console.log('[webhook/stripe] order', orderId, '→ paid (via checkout.session.completed)');

        trackFunnelEvent('payment_completed', {
          orderId,
          email: order.customerEmail,
          domain: order.requirements?.desiredDomain,
        });

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

          if (domainResult.path !== 'purchased') {
            console.log(
              '[webhook/stripe] skipping build for order', orderId,
              '— awaiting DNS verification (path:', domainResult.path + ')',
            );
            return;
          }

          // Domain secured — kick off site build & deploy pipeline.
          console.log('[webhook/stripe] starting site build for order', orderId);

          if (process.env.PAPERCLIP_API_URL) {
            const triggerResult = await triggerPaperclipBuild(orderId);
            if (triggerResult.ok) {
              console.log('[webhook/stripe] delegated build to Paperclip swarm:', triggerResult.issueId);
              return;
            }
            console.error('[webhook/stripe] Paperclip trigger failed, falling back to SSH build:', triggerResult.error);
          }

          const buildResult = await buildAndDeployOrder(orderId);
          if (buildResult.ok) {
            console.log('[webhook/stripe] site live for order', orderId, '—', buildResult.siteUrl);
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

    // Fallback for legacy one-time payment flows. Idempotent with the above.
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;

      // orderId is embedded in payment_intent_data.metadata at Checkout Session creation.
      const orderId = pi.metadata?.orderId;
      if (!orderId) {
        console.warn('[webhook/stripe] payment_intent.succeeded has no orderId in metadata', pi.id);
        return;
      }

      const order = await orderStore.findById(orderId);
      if (!order) {
        console.warn('[webhook/stripe] order not found', orderId, 'pi', pi.id);
        return;
      }

      const paymentInfo: PaymentInfo = {
        // Preserve stripeSessionId + amountCents already stored on the order.
        stripeSessionId: order.payment?.stripeSessionId ?? '',
        amountCents: order.payment?.amountCents ?? pi.amount ?? 8900,
        stripePaymentIntentId: pi.id,
        paidAt: new Date().toISOString(),
      };

      const result = await orderStore.transition(orderId, {
        event: 'PAYMENT_SUCCEEDED',
        note: 'payment_intent.succeeded webhook',
        meta: { stripePaymentIntentId: pi.id },
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

        if (result.ok) {
          trackFunnelEvent('payment_completed', {
            orderId,
            email: order.customerEmail,
            domain: order.requirements?.desiredDomain,
          });
        }

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

          // Only start the build when the domain is fully acquired.
          // For existing-domain orders (path: 'dns_pending'), the order stays in
          // 'domain_purchasing' until POST /api/domains/verify confirms the A record
          // resolves to CONTABO_VPS_IP — that route calls buildAndDeployOrder itself.
          if (domainResult.path !== 'purchased') {
            console.log(
              '[webhook/stripe] skipping build for order', orderId,
              '— awaiting DNS verification (path:', domainResult.path + ')',
            );
            return;
          }

          // Domain secured — kick off site build & deploy pipeline.
          // Domain secured — kick off site build & deploy pipeline.
          console.log('[webhook/stripe] starting site build for order', orderId);

          if (process.env.PAPERCLIP_API_URL) {
            const triggerResult = await triggerPaperclipBuild(orderId);
            if (triggerResult.ok) {
              console.log('[webhook/stripe] delegated build to Paperclip swarm:', triggerResult.issueId);
              return;
            }
            console.error('[webhook/stripe] Paperclip trigger failed, falling back to SSH build:', triggerResult.error);
          }

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

      // orderId is embedded in payment_intent_data.metadata at Checkout Session creation.
      const orderId = pi.metadata?.orderId;
      if (!orderId) {
        console.warn(
          '[webhook/stripe] payment_intent.payment_failed — no orderId in metadata for pi',
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
