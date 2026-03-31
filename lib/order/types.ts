/**
 * Order Lifecycle State Machine — Types
 *
 * Single source of truth for all order state, transitions, and audit trail.
 *
 * State flow (happy path):
 *   new → qualifying → payment_pending → paid → domain_purchasing → building → deploying → live
 *
 * Failure states (with rollback paths):
 *   payment_failed     ← from payment_pending  → retry → payment_pending
 *   domain_failed      ← from domain_purchasing → retry → domain_purchasing
 *   build_failed       ← from building          → retry → building
 *   deploy_failed      ← from deploying         → retry → deploying
 *
 * Terminal states: live, cancelled
 */

// ─── States ────────────────────────────────────────────────────────────────

export type OrderState =
  // Happy-path states
  | 'new'               // Order created, requirements not yet gathered
  | 'qualifying'        // Eve is chatting with customer, capturing requirements
  | 'payment_pending'   // Requirements captured, awaiting Stripe payment
  | 'paid'              // Payment confirmed, ready to procure domain
  | 'domain_purchasing' // Porkbun domain purchase in-flight
  | 'building'          // Website is being built
  | 'deploying'         // Site bundle is being deployed to Vercel
  | 'live'              // Site is live at customer domain (terminal success)
  // Failure states
  | 'payment_failed'    // Stripe charge declined / session expired
  | 'domain_failed'     // Porkbun domain unavailable or purchase failed
  | 'build_failed'      // AI site generation failed
  | 'deploy_failed'     // Vercel deploy failed
  // Cancellation
  | 'cancelled';        // Explicitly cancelled (terminal)

// ─── Events ────────────────────────────────────────────────────────────────

export type OrderEvent =
  | 'START_QUALIFYING'     // new → qualifying
  | 'REQUIREMENTS_READY'   // qualifying → payment_pending
  | 'PAYMENT_SUCCEEDED'    // payment_pending → paid
  | 'PAYMENT_FAILED'       // payment_pending → payment_failed
  | 'RETRY_PAYMENT'        // payment_failed → payment_pending
  | 'START_DOMAIN'         // paid → domain_purchasing
  | 'DOMAIN_PURCHASED'     // domain_purchasing → building
  | 'DOMAIN_FAILED'        // domain_purchasing → domain_failed
  | 'RETRY_DOMAIN'         // domain_failed → domain_purchasing
  | 'BUILD_SUCCEEDED'      // building → deploying
  | 'BUILD_FAILED'         // building → build_failed
  | 'RETRY_BUILD'          // build_failed → building
  | 'DEPLOY_SUCCEEDED'     // deploying → live
  | 'DEPLOY_FAILED'        // deploying → deploy_failed
  | 'RETRY_DEPLOY'         // deploy_failed → deploying
  | 'CANCEL';              // any non-terminal → cancelled

// ─── Transition table ──────────────────────────────────────────────────────

export const TRANSITIONS: Record<OrderEvent, { from: OrderState[]; to: OrderState }> = {
  START_QUALIFYING:   { from: ['new'],               to: 'qualifying' },
  REQUIREMENTS_READY: { from: ['qualifying'],         to: 'payment_pending' },
  PAYMENT_SUCCEEDED:  { from: ['payment_pending'],    to: 'paid' },
  PAYMENT_FAILED:     { from: ['payment_pending'],    to: 'payment_failed' },
  RETRY_PAYMENT:      { from: ['payment_failed'],     to: 'payment_pending' },
  START_DOMAIN:       { from: ['paid'],               to: 'domain_purchasing' },
  DOMAIN_PURCHASED:   { from: ['domain_purchasing'],  to: 'building' },
  DOMAIN_FAILED:      { from: ['domain_purchasing'],  to: 'domain_failed' },
  RETRY_DOMAIN:       { from: ['domain_failed'],      to: 'domain_purchasing' },
  BUILD_SUCCEEDED:    { from: ['building'],           to: 'deploying' },
  BUILD_FAILED:       { from: ['building'],           to: 'build_failed' },
  RETRY_BUILD:        { from: ['build_failed'],       to: 'building' },
  DEPLOY_SUCCEEDED:   { from: ['deploying'],          to: 'live' },
  DEPLOY_FAILED:      { from: ['deploying'],          to: 'deploy_failed' },
  RETRY_DEPLOY:       { from: ['deploy_failed'],      to: 'deploying' },
  CANCEL: {
    from: ['new', 'qualifying', 'payment_pending', 'payment_failed',
           'paid', 'domain_purchasing', 'domain_failed',
           'building', 'build_failed', 'deploying', 'deploy_failed'],
    to: 'cancelled',
  },
};

export const TERMINAL_STATES: ReadonlySet<OrderState> = new Set(['live', 'cancelled']);

// ─── Audit trail ───────────────────────────────────────────────────────────

export interface AuditEntry {
  /** ISO timestamp */
  at: string;
  from: OrderState;
  to: OrderState;
  event: OrderEvent;
  /** Optional human-readable note or structured payload recorded at transition time */
  note?: string;
  /** Key-value metadata (payment intent ID, domain name, deploy URL, etc.) */
  meta?: Record<string, string>;
}

// ─── Requirements captured during qualifying ───────────────────────────────

export interface OrderRequirements {
  /** Business type / industry */
  businessType: string;
  /** What the customer wants the site to do */
  purpose: string;
  /** Desired domain name (may differ from purchased domain) */
  desiredDomain: string;
  /** Colour preferences, tone, etc. */
  style?: string;
  /** Raw transcript summary from Eve's chat */
  chatSummary?: string;
}

// ─── Payment info ──────────────────────────────────────────────────────────

export interface PaymentInfo {
  /** Stripe Checkout Session ID */
  stripeSessionId: string;
  /** Stripe Payment Intent ID (populated after payment_intent.succeeded) */
  stripePaymentIntentId?: string;
  /** Amount in USD cents */
  amountCents: number;
  /** ISO timestamp of successful charge */
  paidAt?: string;
}

// ─── Domain info ───────────────────────────────────────────────────────────

export interface DomainInfo {
  /** Domain actually purchased (may differ from desired) */
  domain: string;
  /** Porkbun transaction ID */
  porkbunTxId?: string;
  /** ISO timestamp of domain registration */
  registeredAt?: string;
}

// ─── Deploy info ───────────────────────────────────────────────────────────

export interface DeployInfo {
  /** Vercel deployment ID */
  vercelDeploymentId?: string;
  /** Public URL of the deployed site */
  siteUrl?: string;
  /** ISO timestamp when site went live */
  liveAt?: string;
}

// ─── Core Order ────────────────────────────────────────────────────────────

export interface Order {
  /** UUID v4 */
  id: string;
  /** Human-readable identifier (e.g. EVE-0001) */
  identifier: string;
  /** Customer email */
  customerEmail: string;
  /** Customer display name */
  customerName?: string;
  /** Current state */
  state: OrderState;
  /** Idempotency key — prevents double-processing across retries */
  idempotencyKey: string;
  /** Requirements captured during qualifying phase */
  requirements?: OrderRequirements;
  /** Payment information */
  payment?: PaymentInfo;
  /** Domain information */
  domain?: DomainInfo;
  /** Deployment information */
  deploy?: DeployInfo;
  /** Full immutable audit trail */
  auditTrail: AuditEntry[];
  /** ISO timestamp of order creation */
  createdAt: string;
  /** ISO timestamp of last state update */
  updatedAt: string;
}

// ─── Input types for creating / transitioning orders ──────────────────────

export interface CreateOrderInput {
  customerEmail: string;
  customerName?: string;
  /** Caller-supplied idempotency key (e.g. derived from chat session ID) */
  idempotencyKey: string;
}

export interface TransitionInput {
  event: OrderEvent;
  note?: string;
  meta?: Record<string, string>;
  /** Partial updates to attach to the order alongside the transition */
  patch?: Partial<Pick<Order, 'requirements' | 'payment' | 'domain' | 'deploy'>>;
}

// ─── Result types ──────────────────────────────────────────────────────────

export type TransitionResult =
  | { ok: true; order: Order }
  | { ok: false; error: 'INVALID_TRANSITION' | 'ORDER_NOT_FOUND' | 'ALREADY_TERMINAL' | 'IDEMPOTENT_SKIP'; detail: string };
