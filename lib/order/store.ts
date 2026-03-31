/**
 * Order Store — persistence interface + in-memory implementation
 *
 * The OrderStore interface decouples the state machine from persistence.
 * The in-memory implementation is suitable for development and single-instance
 * deployments. Replace with a Neon/Postgres-backed implementation for production.
 *
 * IMPORTANT: The in-memory store is module-level — it survives across requests
 * within a single server process but resets on cold starts. Wire up a DB-backed
 * store (see OrderStore interface) before handling real money.
 */

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

// ─── In-memory implementation ──────────────────────────────────────────────

class InMemoryOrderStore implements OrderStore {
  private readonly orders = new Map<string, Order>();
  private readonly byIdempotencyKey = new Map<string, string>(); // key → orderId
  private seq = 0;

  async create(input: CreateOrderInput): Promise<Order> {
    // Idempotency: return existing order if same key was used before.
    const existingId = this.byIdempotencyKey.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.orders.get(existingId);
      if (existing) return existing;
    }

    this.seq += 1;
    const order = createOrder({
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      idempotencyKey: input.idempotencyKey,
      seq: this.seq,
    });

    this.orders.set(order.id, order);
    this.byIdempotencyKey.set(input.idempotencyKey, order.id);
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const id = this.byIdempotencyKey.get(key);
    if (!id) return null;
    return this.orders.get(id) ?? null;
  }

  async transition(id: string, input: TransitionInput): Promise<TransitionResult> {
    const order = this.orders.get(id);
    if (!order) {
      return { ok: false, error: 'ORDER_NOT_FOUND', detail: `No order with id '${id}'` };
    }

    const result = applyTransition(order, input);
    if (result.ok) {
      this.orders.set(id, result.order);
    }
    return result;
  }

  async list(opts: { limit?: number; offset?: number } = {}): Promise<Order[]> {
    const all = [...this.orders.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? 50;
    return all.slice(offset, offset + limit);
  }
}

// ─── Singleton export ───────────────────────────────────────────────────────

// Module-level singleton. In Next.js App Router, this lives in the server
// process and persists across requests within a warm instance.
// Swap this export for a DB-backed implementation (e.g. NeonOrderStore) when
// ready for production persistence.
export const orderStore: OrderStore = new InMemoryOrderStore();
