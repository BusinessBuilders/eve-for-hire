import { NextResponse } from 'next/server';
import { markCtaClicked } from '@/lib/draft/store';
import { getDraftByToken } from '@/lib/draft/store';
import { trackFunnelEvent } from '@/lib/analytics/events';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  try {
    const draft = await getDraftByToken(token);
    await markCtaClicked(token);
    trackFunnelEvent('draft_cta_clicked', { sessionId: draft.sessionId });
  } catch {
    return NextResponse.json({ error: 'Draft not found or expired' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
