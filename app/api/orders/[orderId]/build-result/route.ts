import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/order/store';
import type { DeployInfo } from '@/lib/order/types';

/**
 * POST /api/orders/[orderId]/build-result
 *
 * Callback for the Paperclip swarm to report the final status of a build.
 * Validates a shared secret to prevent unauthorized status changes.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { state, siteUrl, error, secret } = body;

  const callbackSecret = process.env.PAPERCLIP_CALLBACK_SECRET;
  if (!callbackSecret || secret !== callbackSecret) {
    console.warn(`[build-result] Unauthorized callback attempt for order ${orderId}`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const order = await orderStore.findById(orderId);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  console.log(`[build-result] Received ${state} status for order ${orderId}`);

  if (state === 'live') {
    const deployInfo: DeployInfo = {
      siteUrl,
      liveAt: new Date().toISOString(),
    };
    await orderStore.transition(orderId, {
      event: 'DEPLOY_SUCCEEDED',
      note: `Swarm build successful: ${siteUrl}`,
      patch: { deploy: deployInfo },
    });
  } else if (state === 'build_failed') {
    await orderStore.transition(orderId, {
      event: 'BUILD_FAILED',
      note: `Swarm build failed: ${error || 'Unknown error'}`,
    });
  } else if (state === 'deploy_failed') {
    await orderStore.transition(orderId, {
      event: 'DEPLOY_FAILED',
      note: `Swarm deploy failed: ${error || 'Unknown error'}`,
    });
  } else {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
