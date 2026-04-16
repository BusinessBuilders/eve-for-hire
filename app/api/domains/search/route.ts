/**
 * GET /api/domains/search — check domain availability via Porkbun.
 *
 * Two modes:
 *   ?q=<business-name>    — generate slug-based suggestions across common TLDs
 *   ?domain=<exact.com>   — check a specific domain the customer provided
 *
 * Used by Eve's chat interface during the qualifying phase to present domain options.
 *
 * Response: { results: Array<{ domain: string, available: boolean, price?: string }> }
 *
 * Returns 503 when Porkbun credentials are not configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { suggestAvailableDomains, checkDomainAvailability } from '@/lib/porkbun/domain-service';
import { PorkbunApiError } from '@/lib/porkbun/client';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim();
  const domain = searchParams.get('domain')?.trim().toLowerCase();

  if (!q && !domain) {
    return NextResponse.json(
      { error: 'Provide either ?q=<business-name> or ?domain=<exact-domain>' },
      { status: 400 },
    );
  }

  try {
    if (domain) {
      const result = await checkDomainAvailability(domain);
      return NextResponse.json({ results: [result] });
    }

    const results = await suggestAvailableDomains(q!);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Domain lookup timed out — please try again in a moment.' },
        { status: 504 },
      );
    }

    if (err instanceof Error && err.message.includes('not configured')) {
      return NextResponse.json({ error: 'Domain service not configured' }, { status: 503 });
    }

    if (err instanceof PorkbunApiError) {
      console.error('[domains/search] Porkbun error:', err.message, err.status);
      return NextResponse.json({ error: 'Domain lookup failed', detail: err.message }, { status: 502 });
    }

    console.error('[domains/search] unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
