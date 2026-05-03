/**
 * POST /api/orders    — create a new order
 * GET  /api/orders    — list orders (internal use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { orderStore } from '@/lib/order/store';
import type { CreateOrderInput } from '@/lib/order/types';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { customerEmail, customerName, idempotencyKey } = body as Record<string, unknown>;

  if (typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
    return NextResponse.json({ error: 'customerEmail is required and must be a valid email' }, { status: 400 });
  }
  if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8) {
    return NextResponse.json({ error: 'idempotencyKey is required (min 8 chars)' }, { status: 400 });
  }

  const input: CreateOrderInput = {
    customerEmail,
    idempotencyKey,
    ...(typeof customerName === 'string' ? { customerName } : {}),
  };

  const order = await orderStore.create(input);
  return NextResponse.json(order, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);
  const offset = Number(searchParams.get('offset') ?? 0);

  const orders = await orderStore.list({ limit, offset });
  return NextResponse.json({ orders, limit, offset });
}
