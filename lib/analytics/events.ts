/**
 * Conversion Funnel Analytics
 *
 * Tracks the six steps that measure Phase 1 success (10 paying customers / 90 days):
 *   chat_opened → qualifying_started → domain_searched →
 *   checkout_initiated → payment_completed → site_live
 *
 * Storage: `AnalyticsEvent` model in Prisma.
 *
 * Design: trackFunnelEvent() is always fire-and-forget — errors are caught and
 * logged, never thrown — so analytics can never disrupt the user flow.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';

// ─── Event types ──────────────────────────────────────────────────────────────

export type FunnelEvent =
  | 'chat_opened'
  | 'qualifying_started'
  | 'domain_searched'
  | 'checkout_initiated'
  | 'payment_completed'
  | 'site_live'
  | 'draft_generated'
  | 'draft_viewed'
  | 'draft_cta_clicked';

export interface EventProps {
  sessionId?: string;
  orderId?: string;
  domain?: string;
  email?: string;
  keyword?: string;
  siteUrl?: string;
  [key: string]: string | undefined;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record a funnel event. Never throws — analytics must not block the happy path.
 */
export function trackFunnelEvent(event: FunnelEvent, props: EventProps = {}): void {
  try {
    const { sessionId, orderId, domain, email, ...rest } = props;
    const extraProps = Object.keys(rest).length > 0 ? JSON.stringify(rest) : null;

    // Fire and forget: don't await the promise
    prisma.analyticsEvent.create({
      data: {
        id: randomUUID(),
        event,
        sessionId: sessionId ?? null,
        orderId: orderId ?? null,
        domain: domain ?? null,
        email: email ?? null,
        props: extraProps,
      }
    }).catch(err => {
      console.error('[analytics] failed to write event to db', event, err);
    });

    console.log('[analytics]', event, { sessionId, orderId, domain, email, ...rest });
  } catch (err) {
    console.error('[analytics] failed to track event', event, err);
  }
}
