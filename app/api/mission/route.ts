import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const GOAL = 43_000; // $43,000 for Unitree G1 humanoid robot

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;
  const configured = !!key;

  try {
    const progress = await prisma.missionProgress.findUnique({
      where: { id: 'current' },
    });

    const totalCents = progress?.totalRaised ?? 0;

    return NextResponse.json(
      { raised: Math.floor(totalCents / 100), goal: GOAL, configured },
      { headers: { 'Cache-Control': 'public, max-age=300' } },
    );
  } catch (err) {
    console.error('[mission] Database query failed:', err);
    return NextResponse.json(
      { raised: 0, goal: GOAL, configured, error: true },
      { status: 500 },
    );
  }
}
