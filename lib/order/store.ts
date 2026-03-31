/**
 * Order Store — persistence interface + SQLite implementation
 *
 * The OrderStore interface decouples the state machine from persistence.
 * The SQLite implementation is production-ready for single-VPS deployments.
 *
 * Database path (in order of precedence):
 *   1. ORDER_DB_PATH env var — absolute path to the .db file
 *   2. Falls back to <cwd>/data/orders.db
 *
 * The parent directory of the database file is created automatically on first use.
 * Set ORDER_DB_PATH to a persistent volume mount in production.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { createOrder, applyTransition } from './state-machine';
import type {
  Order,
  CreateOrderInput,
  TransitionInput,
  TransitionResult,
} from './types';

// ─── Store interface ────────────────────────────────────────────────────────

export interface OrderStore {
  create(input: CreateOrderInput): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByIdempotencyKey(key: string): Promise<Order | null>;
  transition(id: string, input: TransitionInput): Promise<TransitionResult>;
  list(opts?: { limit?: number; offset?: number }): Promise<Order[]>;
}

// ─── SQLite helpers ─────────────────────────────────────────────────────────

function resolveDbPath(): string {
  const dbPath = process.env.ORDER_DB_PATH ?? path.join(process.cwd(), 'data', 'orders.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dbPath;
}

function openDb(): Database.Database {
  const dbPath = resolveDbPath();
  const db = new Database(dbPath);

  // WAL mode: concurrent readers don't block a single writer.
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id              TEXT PRIMARY KEY,
      idempotency_key TEXT NOT NULL UNIQUE,
      state           TEXT NOT NULL,
      seq             INTEGER NOT NULL,
      data            TEXT NOT NULL,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO meta (key, value) VALUES ('next_seq', '0');
  `);

  return db;
}

// Singleton database connection.
// In production: module-level variable, one connection per process.
// In development: attached to `global` so Next.js HMR module re-evaluations
// reuse the same connection instead of leaking file descriptors.
declare global {
  // eslint-disable-next-line no-var
  var __orderDb: Database.Database | undefined;
}

function getDb(): Database.Database {
  if (process.env.NODE_ENV === 'development') {
    if (!global.__orderDb) {
      global.__orderDb = openDb();
    }
    return global.__orderDb;
  }

  // Production: module-level singleton is fine (no HMR).
  if (!_db) {
    _db = openDb();
  }
  return _db;
}

let _db: Database.Database | null = null;

// ─── SQLite implementation ──────────────────────────────────────────────────

class SqliteOrderStore implements OrderStore {
  private get db(): Database.Database {
    return getDb();
  }

  async create(input: CreateOrderInput): Promise<Order> {
    // Wrap in a transaction so seq increment + insert are atomic.
    const order = this.db.transaction((): Order => {
      // Idempotency: return existing order for the same key.
      const existing = this.db
        .prepare<[string], { data: string }>(
          'SELECT data FROM orders WHERE idempotency_key = ?'
        )
        .get(input.idempotencyKey);
      if (existing) {
        return JSON.parse(existing.data) as Order;
      }

      // Atomically increment and read the sequence counter.
      this.db
        .prepare("UPDATE meta SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'next_seq'")
        .run();
      const seqRow = this.db
        .prepare<[], { seq: number }>("SELECT CAST(value AS INTEGER) AS seq FROM meta WHERE key = 'next_seq'")
        .get();
      const seq = seqRow!.seq;

      const newOrder = createOrder({
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        idempotencyKey: input.idempotencyKey,
        seq,
      });

      this.db
        .prepare(
          `INSERT INTO orders (id, idempotency_key, state, seq, data, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          newOrder.id,
          newOrder.idempotencyKey,
          newOrder.state,
          seq,
          JSON.stringify(newOrder),
          newOrder.createdAt,
          newOrder.updatedAt
        );

      return newOrder;
    })();

    return order;
  }

  async findById(id: string): Promise<Order | null> {
    const row = this.db
      .prepare<[string], { data: string }>('SELECT data FROM orders WHERE id = ?')
      .get(id);
    return row ? (JSON.parse(row.data) as Order) : null;
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const row = this.db
      .prepare<[string], { data: string }>('SELECT data FROM orders WHERE idempotency_key = ?')
      .get(key);
    return row ? (JSON.parse(row.data) as Order) : null;
  }

  async transition(id: string, input: TransitionInput): Promise<TransitionResult> {
    const result = this.db.transaction((): TransitionResult => {
      const row = this.db
        .prepare<[string], { data: string }>('SELECT data FROM orders WHERE id = ?')
        .get(id);

      if (!row) {
        return { ok: false, error: 'ORDER_NOT_FOUND', detail: `No order with id '${id}'` };
      }

      const order = JSON.parse(row.data) as Order;
      const transitionResult = applyTransition(order, input);

      if (transitionResult.ok) {
        const updated = transitionResult.order;
        this.db
          .prepare('UPDATE orders SET state = ?, data = ?, updated_at = ? WHERE id = ?')
          .run(updated.state, JSON.stringify(updated), updated.updatedAt, id);
      }

      return transitionResult;
    })();

    return result;
  }

  async list(opts: { limit?: number; offset?: number } = {}): Promise<Order[]> {
    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;
    const rows = this.db
      .prepare<[number, number], { data: string }>(
        'SELECT data FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(limit, offset);
    return rows.map((r) => JSON.parse(r.data) as Order);
  }
}

// ─── Singleton export ───────────────────────────────────────────────────────

export const orderStore: OrderStore = new SqliteOrderStore();
