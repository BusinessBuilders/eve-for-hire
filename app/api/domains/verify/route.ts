/**
 * POST /api/domains/verify — check DNS propagation for an existing-domain order
 * and advance it to 'building' if the A record resolves to CONTABO_VPS_IP.
 *
 * Called by the frontend (customer status page polling) or an internal cron job.
 * Safe to call repeatedly — idempotent if DNS is not yet propagated or if the
 * order is already past 'domain_purchasing'.
 *
 * Body: { orderId: string }
 *
 * Response (DNS verified — order advanced to building):
 *   { verified: true, domain: string, resolvedIps: string[] }
 *
 * Response (DNS not ready yet — order stays in domain_purchasing):
 *   { verified: false, domain: string, resolvedIps: string[], reason: string }
 *
 * Response (error):
 *   { error: string }  →  status 400 | 503
 */

import { NextRequest, NextResponse } from 'next/server';
import { advanceDomainIfDnsReady } from '@/lib/porkbun/dns-verify';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { orderId } = body as Record<string, unknown>;
  if (typeof orderId !== 'string' || !orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const contaboIp = process.env.CONTABO_VPS_IP;
  if (!contaboIp) {
    return NextResponse.json({ error: 'DNS verification not configured (CONTABO_VPS_IP missing)' }, { status: 503 });
  }

  console.log('[domains/verify] checking DNS for order', orderId);
  const result = await advanceDomainIfDnsReady(orderId);
  console.log(
    '[domains/verify] result for order', orderId,
    '— verified:', result.verified,
    '— domain:', result.domain,
    ...(!result.verified ? ['— reason:', (result as { reason?: string }).reason] : []),
  );

  // Return 200 for both verified and not-yet-verified — the client polls and retries.
  // Only genuine errors (missing order, misconfiguration) return non-200.
  if (!result.verified && (result as { reason?: string }).reason?.includes('not found')) {
    return NextResponse.json({ error: (result as { reason?: string }).reason }, { status: 404 });
  }

  return NextResponse.json(result);
}
