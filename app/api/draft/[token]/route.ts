import { NextResponse } from 'next/server';
import { getDraftByToken, incrementViewCount } from '@/lib/draft/store';
import { trackFunnelEvent } from '@/lib/analytics/events';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let draft;
  try {
    draft = await getDraftByToken(token);
  } catch {
    return NextResponse.json({ error: 'Draft not found or expired' }, { status: 404 });
  }

  await incrementViewCount(token);
  trackFunnelEvent('draft_viewed', { sessionId: draft.sessionId });

  return NextResponse.json({
    businessName: draft.businessName,
    tagline: draft.tagline,
    category: draft.category,
    primaryColor: draft.primaryColor,
    heroHtml: draft.heroHtml,
    viewCount: draft.viewCount + 1,
    ctaClicked: draft.ctaClicked,
    expiresAt: draft.expiresAt,
  });
}
