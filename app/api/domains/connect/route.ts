/**
 * GET /api/domains/connect?domain=<domain> — return DNS instructions for a customer-owned domain.
 *
 * Used when the customer wants to connect an existing domain they already own.
 * No Porkbun purchase is made. Instead, we return the A record settings they
 * need to configure at their registrar to point the domain at Eve's Contabo VPS.
 *
 * Response:
 *   {
 *     domain: string,
 *     aRecord: string,         // IP to set
 *     steps: string[]          // human-readable instructions
 *   }
 *
 * Returns 503 when CONTABO_VPS_IP is not configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildDnsInstructions } from '@/lib/porkbun/domain-service';

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/;

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.trim().toLowerCase();

  if (!domain) {
    return NextResponse.json({ error: '?domain= parameter is required' }, { status: 400 });
  }

  if (!DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
  }

  try {
    const instructions = buildDnsInstructions(domain);
    return NextResponse.json(instructions);
  } catch (err) {
    if (err instanceof Error && err.message.includes('CONTABO_VPS_IP')) {
      return NextResponse.json({ error: 'DNS service not configured' }, { status: 503 });
    }
    console.error('[domains/connect] unexpected error for domain', domain, ':', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
