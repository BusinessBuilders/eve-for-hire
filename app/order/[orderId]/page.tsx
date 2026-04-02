/**
 * /order/[orderId] — server-verified order status page.
 *
 * This page is the Stripe success_url destination. It verifies payment server-side
 * before showing any success state — the URL params alone are not trusted.
 *
 * Verification strategy:
 *   1. Look up order in the store.
 *   2. If order is already in a paid-or-later state → show success immediately.
 *   3. If order is still payment_pending and session_id is in the URL, verify the
 *      Checkout Session with Stripe directly (bridging webhook delivery lag).
 *   4. If neither → show "verifying" state with a manual refresh link.
 *
 * Hard gate: success UI is only rendered when payment is confirmed server-side.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Stripe from 'stripe';
import { orderStore } from '@/lib/order/store';
import type { OrderState } from '@/lib/order/types';

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

const PAID_OR_LATER: ReadonlySet<OrderState> = new Set([
  'paid',
  'domain_purchasing',
  'building',
  'deploying',
  'live',
]);

export default async function OrderPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { session_id } = await searchParams;

  const order = await orderStore.findById(orderId);
  if (!order) notFound();

  // Determine payment status without trusting URL params.
  const alreadyPaid = PAID_OR_LATER.has(order.state);

  // If the order is still payment_pending, ask Stripe directly (webhook may be in-flight).
  let stripeConfirmed = false;
  if (!alreadyPaid && order.state === 'payment_pending' && session_id) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      try {
        const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
        const session = await stripe.checkout.sessions.retrieve(session_id);
        // Both conditions must hold: payment succeeded AND the session belongs to this order.
        stripeConfirmed =
          session.payment_status === 'paid' && session.client_reference_id === orderId;
      } catch {
        // Stripe unavailable or invalid session_id — fall back to order state only.
      }
    }
  }

  const isPaid = alreadyPaid || stripeConfirmed;
  const isFailed = order.state === 'payment_failed';
  const isCancelled = order.state === 'cancelled';

  // --- shared styles ---
  const card: React.CSSProperties = {
    background: 'var(--glass)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '3rem 4rem',
    backdropFilter: 'blur(10px)',
    maxWidth: '560px',
    width: '100%',
  };
  const heading: React.CSSProperties = {
    fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
    fontSize: 'clamp(2.5rem, 8vw, 4rem)',
    marginBottom: '1rem',
  };
  const body: React.CSSProperties = {
    color: 'var(--muted)',
    fontSize: '1.1rem',
    marginBottom: '2.5rem',
    lineHeight: 1.6,
  };
  const btn = (bg: string, color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '0.9rem 2.5rem',
    background: bg,
    color,
    fontWeight: 700,
    fontSize: '1rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontFamily: 'var(--font-outfit), Outfit, sans-serif',
  });

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        fontFamily: 'var(--font-outfit), Outfit, sans-serif',
        color: 'var(--text)',
      }}
    >
      <div style={card}>
        {isPaid ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🤖</div>
            <h1
              style={{
                ...heading,
                background: 'linear-gradient(135deg, var(--cyan) 0%, #fff 50%, var(--coral) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Payment confirmed!
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                color: 'var(--cyan)',
                fontSize: '1rem',
                marginBottom: '0.75rem',
              }}
            >
              Order {order.identifier}
            </p>
            <p style={body}>
              Your first month payment has been received. Eve is now building your website.
              <br />
              You&apos;ll receive an email at <strong>{order.customerEmail}</strong> when your site
              goes live.
            </p>
            <Link href="/" style={btn('linear-gradient(135deg, var(--cyan) 0%, #00a8cc 100%)', '#000')}>
              ← Back to Eve.center
            </Link>
          </>
        ) : isFailed ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚠️</div>
            <h1 style={{ ...heading, color: 'var(--coral)' }}>Payment failed</h1>
            <p style={body}>
              Your payment didn&apos;t go through. No charge was made.
              <br />
              Please try again.
            </p>
            <Link
              href="/#hire"
              style={btn('linear-gradient(135deg, var(--coral) 0%, #cc5500 100%)', '#fff')}
            >
              Try again
            </Link>
          </>
        ) : isCancelled ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚫</div>
            <h1 style={{ ...heading, color: 'var(--muted)' }}>Order cancelled</h1>
            <p style={body}>This order has been cancelled.</p>
            <Link href="/" style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>
              ← Back to Eve.center
            </Link>
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
            <h1 style={{ ...heading, color: 'var(--text)' }}>Verifying payment…</h1>
            <p style={body}>
              Your payment is being confirmed. This usually takes a few seconds.
              <br />
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                  fontSize: '0.9rem',
                }}
              >
                Order {order.identifier}
              </span>
            </p>
            {/* Refresh link re-hits this Server Component, re-running the Stripe check. */}
            <Link
              href={`/order/${orderId}${session_id ? `?session_id=${session_id}` : ''}`}
              style={btn('var(--glass)', 'var(--text)')}
            >
              ↻ Refresh status
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
