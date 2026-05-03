/**
 * POST /api/orders/[orderId]/transition — apply a state machine event to an order
 *
 * Body: { event: OrderEvent, note?: string, meta?: Record<string,string>, patch?: {...} }
 *
 * Returns the updated order on success, or a structured error on invalid transitions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { orderStore } from '@/lib/order/store';
import type { TransitionInput, OrderEvent } from '@/lib/order/types';
import { TRANSITIONS } from '@/lib/order/types';

const VALID_EVENTS = new Set(Object.keys(TRANSITIONS) as OrderEvent[]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { orderId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { event, note, meta, patch } = body as Record<string, unknown>;

  if (typeof event !== 'string' || !VALID_EVENTS.has(event as OrderEvent)) {
    return NextResponse.json(
      { error: `Invalid event. Valid events: ${[...VALID_EVENTS].join(', ')}` },
      { status: 400 }
    );
  }

  const input: TransitionInput = {
    event: event as OrderEvent,
    ...(typeof note === 'string' ? { note } : {}),
    ...(meta && typeof meta === 'object' ? { meta: meta as Record<string, string> } : {}),
    ...(patch && typeof patch === 'object' ? { patch: patch as TransitionInput['patch'] } : {}),
  };

  console.log(`[orders] transition orderId=${orderId} event=${event}`);

  const result = await orderStore.transition(orderId, input);

  if (!result.ok) {
    const status =
      result.error === 'ORDER_NOT_FOUND' ? 404 :
      result.error === 'IDEMPOTENT_SKIP' ? 200 :
      422;

    if (result.error === 'IDEMPOTENT_SKIP') {
      // Return the current order as-is for idempotent replays
      const order = await orderStore.findById(orderId);
      console.log(`[orders] idempotent skip orderId=${orderId} event=${event} state=${order?.state}`);
      return NextResponse.json({ idempotentSkip: true, order });
    }

    console.warn(`[orders] transition failed orderId=${orderId} event=${event} error=${result.error} detail=${result.detail}`);
    return NextResponse.json({ error: result.error, detail: result.detail }, { status });
  }

  console.log(`[orders] transition ok orderId=${orderId} state=${result.order.state}`);
  return NextResponse.json(result.order);
}
