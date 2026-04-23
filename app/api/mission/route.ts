import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const GOAL = 43_000; // $43,000 for Unitree G1 humanoid robot

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
    // Read the balance instead of paginating through all charges to prevent O(N) performance issues
    const balance = await stripe.balance.retrieve();
    totalCents = balance.available.reduce((sum, b) => sum + b.amount, 0) + balance.pending.reduce((sum, b) => sum + b.amount, 0);
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
