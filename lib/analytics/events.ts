/**
 * Conversion Funnel Analytics
 *
 * Tracks the six steps that measure Phase 1 success (10 paying customers / 90 days):
 *   chat_opened → qualifying_started → domain_searched →
 *   checkout_initiated → payment_completed → site_live
 *
 * Storage: append-only `analytics_events` table in the same SQLite database as
 * orders (ORDER_DB_PATH). Each row is immutable once written.
 *
 * Design: trackFunnelEvent() is always fire-and-forget — errors are caught and
 * logged, never thrown — so analytics can never disrupt the user flow.
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

// ─── Event types ──────────────────────────────────────────────────────────────

export type FunnelEvent =
  | 'chat_opened'
  | 'qualifying_started'
  | 'domain_searched'
  | 'checkout_initiated'
  | 'payment_completed'
  | 'site_live';

export interface EventProps {
  sessionId?: string;
  orderId?: string;
  domain?: string;
  email?: string;
  keyword?: string;
  siteUrl?: string;
  [key: string]: string | undefined;
}

// ─── SQLite helpers ───────────────────────────────────────────────────────────

function resolveDbPath(): string {
  const dbPath =
    process.env.ORDER_DB_PATH ?? path.join(process.cwd(), 'data', 'orders.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dbPath;
}

function openDb(): Database.Database {
  const db = new Database(resolveDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  // DDL — create table + indexes for the funnel events log.
  db.prepare(
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id         TEXT PRIMARY KEY,
      event      TEXT NOT NULL,
      session_id TEXT,
      order_id   TEXT,
      domain     TEXT,
      email      TEXT,
      props      TEXT,
      ts         TEXT NOT NULL
    )`
  ).run();
  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events (event)`
  ).run();
  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_analytics_ts ON analytics_events (ts)`
  ).run();
  return db;
}

// Singleton: reuse across Next.js HMR module evaluations in dev, stable in prod.
declare global {
  // eslint-disable-next-line no-var
  var __analyticsDb: Database.Database | undefined;
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (process.env.NODE_ENV === 'development') {
    if (!global.__analyticsDb) global.__analyticsDb = openDb();
    return global.__analyticsDb;
  }
  if (!_db) _db = openDb();
  return _db;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record a funnel event. Never throws — analytics must not block the happy path.
 */
export function trackFunnelEvent(event: FunnelEvent, props: EventProps = {}): void {
  try {
    const db = getDb();
    const { sessionId, orderId, domain, email, ...rest } = props;
    const extraProps = Object.keys(rest).length > 0 ? JSON.stringify(rest) : null;

    db.prepare(
      `INSERT INTO analytics_events (id, event, session_id, order_id, domain, email, props, ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      event,
      sessionId ?? null,
      orderId ?? null,
      domain ?? null,
      email ?? null,
      extraProps,
      new Date().toISOString(),
    );

    console.log('[analytics]', event, { sessionId, orderId, domain, email, ...rest });
  } catch (err) {
    console.error('[analytics] failed to track event', event, err);
  }
}
