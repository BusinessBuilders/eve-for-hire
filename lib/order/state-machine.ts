/**
 * Order State Machine — Transition Engine
 *
 * Enforces valid state transitions using the TRANSITIONS table.
 * All transitions are idempotent: calling the same event on an already-
 * transitioned order (where `to` state matches current state) is a safe no-op.
 */

import { randomUUID } from 'crypto';
import {
  TRANSITIONS,
  TERMINAL_STATES,
  type Order,
  type OrderEvent,
  type TransitionInput,
  type TransitionResult,
} from './types';

/**
 * Apply an event to an order, returning either the updated order or an error.
 * Does NOT mutate the input order — returns a new object.
 */
export function applyTransition(order: Order, input: TransitionInput): TransitionResult {
  const rule = TRANSITIONS[input.event];
  if (!rule) {
    return {
      ok: false,
      error: 'INVALID_TRANSITION',
      detail: `Unknown event: ${input.event}`,
    };
  }

  // Idempotency: if we're already in the target state, treat as a safe skip.
  if (order.state === rule.to) {
    return { ok: false, error: 'IDEMPOTENT_SKIP', detail: `Order is already in state '${rule.to}'` };
  }

  // Reject transitions from terminal states, except for the explicit RESET_TO_BUILDING administrative event.
  if (TERMINAL_STATES.has(order.state) && input.event !== 'RESET_TO_BUILDING') {
    return {
      ok: false,
      error: 'ALREADY_TERMINAL',
      detail: `Order ${order.id} is in terminal state '${order.state}' — no further transitions allowed`,
    };
  }

  // Validate that the current state is a valid source for this event.
  if (!rule.from.includes(order.state)) {
    return {
      ok: false,
      error: 'INVALID_TRANSITION',
      detail: `Cannot apply '${input.event}' from state '${order.state}'. Valid source states: ${rule.from.join(', ')}`,
    };
  }

  const now = new Date().toISOString();

  const auditEntry = {
    at: now,
    from: order.state,
    to: rule.to,
    event: input.event,
    ...(input.note ? { note: input.note } : {}),
    ...(input.meta ? { meta: input.meta } : {}),
  };

  const updated: Order = {
    ...order,
    ...(input.patch ?? {}),
    state: rule.to,
    auditTrail: [...order.auditTrail, auditEntry],
    updatedAt: now,
  };

  return { ok: true, order: updated };
}

/**
 * Validate that an event is applicable to an order without applying it.
 */
export function canApply(order: Order, event: OrderEvent): boolean {
  if (TERMINAL_STATES.has(order.state)) return false;
  const rule = TRANSITIONS[event];
  if (!rule) return false;
  return rule.from.includes(order.state);
}

/**
 * Return the set of events that can legally be applied to an order right now.
 */
export function availableEvents(order: Order): OrderEvent[] {
  if (TERMINAL_STATES.has(order.state)) return [];
  return (Object.keys(TRANSITIONS) as OrderEvent[]).filter((event) =>
    TRANSITIONS[event].from.includes(order.state)
  );
}

/**
 * Generate a sequential human-readable order identifier.
 * Format: EVE-NNNN (zero-padded to 4 digits).
 */
export function makeIdentifier(seq: number): string {
  return `EVE-${String(seq).padStart(4, '0')}`;
}

/**
 * Build a brand-new Order in the 'new' state.
 */
export function createOrder(params: {
  customerEmail: string;
  customerName?: string;
  idempotencyKey: string;
  seq: number;
}): Order {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    identifier: makeIdentifier(params.seq),
    customerEmail: params.customerEmail,
    ...(params.customerName ? { customerName: params.customerName } : {}),
    state: 'new',
    idempotencyKey: params.idempotencyKey,
    auditTrail: [],
    createdAt: now,
    updatedAt: now,
  };
}
