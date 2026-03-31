import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const GOAL = 100_000; // $100,000 for Unitree G1 humanoid robot

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    return NextResponse.json(
      { raised: 0, goal: GOAL, configured: false },
      { headers: { 'Cache-Control': 'public, max-age=300' } },
    );
  }

  const stripe = new Stripe(key, { apiVersion: '2023-10-16' });

  let totalCents = 0;
  try {
    // List successful charges (tip jar payments)
    // For MVP: single page of 100. Add pagination when tips exceed ~$5k.
    const charges = await stripe.charges.list({ limit: 100 });
    for (const charge of charges.data) {
      if (charge.paid && !charge.refunded) {
        totalCents += charge.amount;
      }
    }
  } catch (err) {
    console.error('[mission] Stripe query failed:', err);
    return NextResponse.json(
      { raised: 0, goal: GOAL, configured: true, error: true },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { raised: Math.floor(totalCents / 100), goal: GOAL, configured: true },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
