/**
 * Order Store — persistence interface + Prisma implementation
 *
 * The OrderStore interface decouples the state machine from persistence.
 * This implementation uses Prisma for unified database management.
 */

import { prisma } from '@/lib/db';
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
  findByDomain(domain: string): Promise<Order | null>;
  transition(id: string, input: TransitionInput): Promise<TransitionResult>;
  list(opts?: { limit?: number; offset?: number }): Promise<Order[]>;
}

// ─── Mapping helper ────────────────────────────────────────────────────────

function mapOrder(p: any): Order {
  return {
    id: p.id,
    identifier: p.identifier,
    customerEmail: p.customerEmail,
    customerName: p.customerName || undefined,
    state: p.state as any,
    idempotencyKey: p.idempotencyKey,
    requirements: p.requirements ? JSON.parse(p.requirements) : undefined,
    payment: p.payment ? JSON.parse(p.payment) : undefined,
    domain: p.domain ? JSON.parse(p.domain) : undefined,
    deploy: p.deploy ? JSON.parse(p.deploy) : undefined,
    auditTrail: JSON.parse(p.auditTrail),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ─── Prisma implementation ──────────────────────────────────────────────────

class PrismaOrderStore implements OrderStore {
  async create(input: CreateOrderInput): Promise<Order> {
    // Idempotency: return existing order for the same key.
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey }
    });
    if (existing) {
      return mapOrder(existing);
    }

    return await prisma.$transaction(async (tx) => {
      // Get next sequence number
      const maxSeq = await tx.order.aggregate({
        _max: { seq: true }
      });
      const seq = (maxSeq._max.seq ?? 0) + 1;

      const newOrder = createOrder({
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        idempotencyKey: input.idempotencyKey,
        seq,
      });

      const created = await tx.order.create({
        data: {
          id: newOrder.id,
          identifier: newOrder.identifier,
          seq: seq,
          customerEmail: newOrder.customerEmail,
          customerName: newOrder.customerName || null,
          state: newOrder.state,
          idempotencyKey: newOrder.idempotencyKey,
          auditTrail: JSON.stringify(newOrder.auditTrail),
          createdAt: new Date(newOrder.createdAt),
          updatedAt: new Date(newOrder.updatedAt),
        }
      });

      return mapOrder(created);
    });
  }

  async findById(id: string): Promise<Order | null> {
    const p = await prisma.order.findUnique({ where: { id } });
    return p ? mapOrder(p) : null;
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const p = await prisma.order.findUnique({ where: { idempotencyKey: key } });
    return p ? mapOrder(p) : null;
  }

  async findByDomain(domain: string): Promise<Order | null> {
    // Domain info is stored in the 'domain' JSON column.
    // We filter in memory for simplicity in SQLite.
    const orders = await prisma.order.findMany({
      where: {
        domain: {
          contains: domain
        }
      }
    });

    const found = orders.find(o => {
      if (!o.domain) return false;
      try {
        const d = JSON.parse(o.domain);
        return d.domain === domain;
      } catch {
        return false;
      }
    });

    return found ? mapOrder(found) : null;
  }

  async transition(id: string, input: TransitionInput): Promise<TransitionResult> {
    return await prisma.$transaction(async (tx) => {
      const p = await tx.order.findUnique({ where: { id } });

      if (!p) {
        return { ok: false, error: 'ORDER_NOT_FOUND', detail: `No order with id '${id}'` };
      }

      const order = mapOrder(p);
      const transitionResult = applyTransition(order, input);

      if (transitionResult.ok) {
        const updated = transitionResult.order;
        await tx.order.update({
          where: { id },
          data: {
            state: updated.state,
            requirements: updated.requirements ? JSON.stringify(updated.requirements) : null,
            payment: updated.payment ? JSON.stringify(updated.payment) : null,
            domain: updated.domain ? JSON.stringify(updated.domain) : null,
            deploy: updated.deploy ? JSON.stringify(updated.deploy) : null,
            auditTrail: JSON.stringify(updated.auditTrail),
            updatedAt: new Date(updated.updatedAt),
          }
        });
        return transitionResult;
      }

      return transitionResult;
    });
  }

  async list(opts: { limit?: number; offset?: number } = {}): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      take: opts.limit ?? 50,
      skip: opts.offset ?? 0,
      orderBy: { createdAt: 'desc' }
    });
    return orders.map(mapOrder);
  }
}

// ─── Singleton export ───────────────────────────────────────────────────────

export const orderStore: OrderStore = new PrismaOrderStore();
