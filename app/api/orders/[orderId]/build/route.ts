/**
 * POST /api/orders/[orderId]/build — trigger the site build & deploy pipeline.
 *
 * This is the manual trigger for the build service. It is also called internally
 * by the Stripe webhook (via after()) once domain processing completes.
 *
 * The endpoint returns immediately with { queued: true } — the build pipeline
 * runs asynchronously so the caller doesn't need to wait up to 8 minutes for
 * DNS propagation + TLS provisioning.
 *
 * For polling build status, use GET /api/orders/[orderId] and watch order.state.
 *
 * States: building → deploying → live  (or build_failed / deploy_failed)
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { auth } from '@/lib/auth';
import { orderStore } from '@/lib/order/store';
import { buildAndDeployOrder } from '@/lib/site/build-service';
import { triggerPaperclipBuild } from '@/lib/site/paperclip-trigger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { orderId } = await params;
  let useSwarm = false;
  try {
    const body = await req.json();
    useSwarm = !!body.swarm;
  } catch {
    // Default to false if body is missing or invalid
  }

  const order = await orderStore.findById(orderId);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.userId && order.userId !== session.user.id) {
    return NextResponse.json({ error: 'You do not own this order' }, { status: 403 });
  }

  // Accepted starting states. The build service handles all internal transitions:
  //   build_failed  → RETRY_BUILD → building → ... (full pipeline)
  //   deploy_failed → RETRY_DEPLOY → deploying → DNS + smoke test only
  //   building      → full pipeline
  //   deploying     → DNS + smoke test only (re-verify already-uploaded site)
  const allowedStates = ['building', 'build_failed', 'deploy_failed', 'deploying'];
  if (!allowedStates.includes(order.state)) {
    return NextResponse.json(
      {
        error: `Cannot trigger build from state '${order.state}'. Order must be in: ${allowedStates.join(', ')}`,
        state: order.state,
      },
      { status: 422 },
    );
  }

  // For build_failed, transition to building so the service sees the correct start state.
  // deploy_failed and deploying retries are handled internally by buildAndDeployOrder.
  if (order.state === 'build_failed') {
    const retryResult = await orderStore.transition(orderId, { event: 'RETRY_BUILD' });
    if (!retryResult.ok) {
      return NextResponse.json(
        { error: 'Failed to reset order to building state', detail: retryResult.detail },
        { status: 422 },
      );
    }
  }

  // Kick off the full pipeline after returning 202 to the caller.
  after(async () => {
    console.log(`[build-route] starting build for order ${orderId} (swarm=${useSwarm})`);
    
    if (useSwarm && process.env.PAPERCLIP_API_URL) {
      const triggerResult = await triggerPaperclipBuild(orderId);
      if (triggerResult.ok) {
        console.log(`[build-route] delegated build to Paperclip swarm: ${triggerResult.issueId}`);
        return;
      }
      console.error(`[build-route] Paperclip trigger failed, falling back to SSH build: ${triggerResult.error}`);
    }

    const result = await buildAndDeployOrder(orderId, useSwarm);
    if (result.ok) {
      console.log(`[build-route] build complete for ${orderId} → ${result.siteUrl}`);
    } else {
      console.error(`[build-route] build failed for ${orderId} (phase=${result.phase}): ${result.error}`);
    }
  });

  return NextResponse.json(
    {
      queued: true,
      orderId,
      message: 'Build pipeline started. Poll GET /api/orders/:id to track progress.',
    },
    { status: 202 },
  );
}
