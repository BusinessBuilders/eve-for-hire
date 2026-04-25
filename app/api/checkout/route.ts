import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const VALID_AMOUNTS = [5, 20, 50];

// Simple in-memory rate limiter for the checkout endpoint (prevent spamming session creation)
const ipCache = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = ipCache.get(ip) || [];
  const recentRequests = requests.filter((time) => now - time < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  recentRequests.push(now);
  ipCache.set(ip, recentRequests);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) {
    console.warn(`[checkout] Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Payments not configured yet' }, { status: 503 });
  }

  let amount: number;
  try {
    const body = await req.json();
    amount = Number(body.amount);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!VALID_AMOUNTS.includes(amount)) {
    return NextResponse.json({ error: 'Invalid tip amount' }, { status: 400 });
  }

  const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  if (!baseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amount * 100,
            product_data: {
              name: `Support Eve — $${amount} tip`,
              description: 'Helping Eve earn her robot body 🦾',
              images: [`${baseUrl}/eve_face_card.png`],
            },
          },
        },
      ],
      metadata: {
        type: 'tip',
        amount: amount.toString(),
      },
      success_url: `${baseUrl}/support/success?amount=${amount}`,
      cancel_url: `${baseUrl}/#support`,
    });
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : 'Payment session failed';
    console.error('[checkout] Stripe session creation failed:', err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!session.url) {
    return NextResponse.json({ error: 'No checkout URL returned' }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
