import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const VALID_AMOUNTS = [5, 20, 50];

export async function POST(req: NextRequest) {
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${req.headers.get('host')}`;

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
