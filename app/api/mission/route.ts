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
    // Auto-paginate through all charges so the total is always accurate
    for await (const charge of stripe.charges.list({ limit: 100 })) {
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
