/**
 * GET /api/orders/[orderId] — fetch a single order by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/order/store';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const order = await orderStore.findById(orderId);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  return NextResponse.json(order);
}
