/**
 * Domain Service — orchestrates the three domain acquisition paths.
 *
 * Path 1 (suggested):  Eve suggested domains; customer picked one → purchase it.
 * Path 2 (new):        Customer specified a domain they don't own → purchase it.
 * Path 3 (existing):   Customer already owns the domain → skip purchase, provide DNS instructions.
 *
 * Domain purchase is STRICTLY gated behind payment confirmation:
 * - processDomainForOrder() checks the order is in 'paid' state before proceeding.
 * - Called exclusively from the Stripe webhook after payment_intent.succeeded.
 *
 * Idempotency:
 * - If the order is already in 'domain_purchasing' or beyond, the function exits safely.
 * - Porkbun registration errors for "already registered" (own account) are treated as success.
 */

import { createPorkbunClient, PorkbunApiError } from './client';
import { orderStore } from '@/lib/order/store';
import type { DomainInfo } from '@/lib/order/types';

// ─── Config ──────────────────────────────────────────────────────────────────

/** IP of the Contabo VPS that serves all Eve-built sites. */
function getContaboIp(): string {
  const ip = process.env.CONTABO_VPS_IP;
  if (!ip) throw new Error('CONTABO_VPS_IP env var is not set');
  return ip;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: string;
}

export interface DomainConnectInstructions {
  domain: string;
  /** The A record value the customer must set */
  aRecord: string;
  steps: string[];
}

export type DomainProcessResult =
  | { ok: true; domain: string; path: 'purchased' }  // purchased + DNS configured → advancing to building
  | { ok: true; domain: string; path: 'dns_pending' } // existing domain → DNS instructions given, waiting for propagation
  | { ok: false; error: string };

// ─── Domain search / suggestions ─────────────────────────────────────────────

/**
 * Generate candidate domain names from a business keyword and check
 * their availability against Porkbun.
 *
 * Used by Eve during the qualifying phase to suggest domains.
 */
export async function suggestAvailableDomains(
  keyword: string,
  // Default to 3 TLDs — Porkbun checks are rate-limited to 1/10s, so 3 checks ≈ 20s max.
  tlds = ['.com', '.co', '.io'],
): Promise<DomainSearchResult[]> {
  const slug = keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63);

  const candidates = tlds.map((tld) => `${slug}${tld}`);

  const client = createPorkbunClient();
  const results = await client.checkDomains(candidates);
  return results
    .filter((r) => r.available)
    .map((r) => ({ domain: r.domain, available: r.available, price: r.price }));
}

/**
 * Check availability of a specific domain (e.g. customer-provided).
 */
export async function checkDomainAvailability(domain: string): Promise<DomainSearchResult> {
  const client = createPorkbunClient();
  const result = await client.checkDomain(domain);
  return { domain: result.domain, available: result.available, price: result.price };
}

// ─── DNS instructions for existing domains ───────────────────────────────────

/**
 * Build the DNS instructions a customer needs to follow to point their
 * existing domain at Eve's Contabo VPS.
 */
export function buildDnsInstructions(domain: string): DomainConnectInstructions {
  const ip = getContaboIp();
  return {
    domain,
    aRecord: ip,
    steps: [
      `Log into your domain registrar's DNS management panel.`,
      `Find or create an A record for your root domain (@ or ${domain}).`,
      `Set the A record value to: ${ip}`,
      `Set the TTL to 600 (10 minutes) or the lowest available.`,
      `(Optional) Add a CNAME record for www pointing to ${domain}.`,
      `DNS changes can take up to 24 hours to propagate globally — usually much faster.`,
    ],
  };
}

// ─── Core: process domain for an order ───────────────────────────────────────

/**
 * Drive the domain acquisition step for an order.
 *
 * Must only be called after payment confirmation (order must be in 'paid' state).
 * Handles all three domain paths. Updates order state machine throughout.
 *
 * Returns { ok: true } when the order has been advanced to 'building',
 * or { ok: false, error } with a human-readable reason on failure.
 */
export async function processDomainForOrder(orderId: string): Promise<DomainProcessResult> {
  const order = await orderStore.findById(orderId);
  if (!order) return { ok: false, error: `Order ${orderId} not found` };

  // ── Payment gate ──────────────────────────────────────────────────────────
  // Only proceed from 'paid'. All other states are either not ready or already past this step.
  if (order.state !== 'paid') {
    if (order.state === 'domain_purchasing') {
      // Already started — return dns_pending for existing-domain path, purchased otherwise.
      const dnsPending = order.requirements?.domainPath === 'existing';
      return {
        ok: true,
        domain: order.domain?.domain ?? '',
        path: dnsPending ? 'dns_pending' : 'purchased',
      };
    }
    if (['building', 'deploying', 'live'].includes(order.state)) {
      return { ok: true, domain: order.domain?.domain ?? '', path: 'purchased' };
    }
    return {
      ok: false,
      error: `Order is in '${order.state}' — domain processing requires 'paid' state`,
    };
  }

  const requirements = order.requirements;
  if (!requirements?.desiredDomain) {
    // Order stays in 'paid' — DOMAIN_FAILED requires 'domain_purchasing' as source.
    // Leaving it in 'paid' means the webhook can retry once requirements are populated.
    const err = 'No desiredDomain in order requirements — cannot process domain';
    console.error('[domain-service] missing requirements for order', orderId, '—', err);
    return { ok: false, error: err };
  }

  const domain = requirements.desiredDomain.trim().toLowerCase();
  const domainPath = requirements.domainPath ?? 'new';

  // ── Advance to domain_purchasing ─────────────────────────────────────────
  const startResult = await orderStore.transition(orderId, {
    event: 'START_DOMAIN',
    note: `Starting domain acquisition (path: ${domainPath})`,
    meta: { domain, domainPath },
  });

  if (!startResult.ok && startResult.error !== 'IDEMPOTENT_SKIP') {
    return { ok: false, error: `Failed to start domain step: ${startResult.detail}` };
  }

  // ── Path 3: existing domain — hold in domain_purchasing, wait for DNS ───────
  // Do NOT fire DOMAIN_PURCHASED here. The order stays in 'domain_purchasing'
  // while the customer updates their DNS settings.
  // POST /api/domains/verify will call advanceDomainIfDnsReady(), which fires
  // DOMAIN_PURCHASED → 'building' once the A record resolves to CONTABO_VPS_IP.
  // The domain name is available via order.requirements.desiredDomain.
  if (domainPath === 'existing') {
    console.log(`[domain-service] Existing domain ${domain} — order held in domain_purchasing, awaiting DNS propagation`);
    return { ok: true, domain, path: 'dns_pending' };
  }

  // ── Paths 1 & 2: purchase the domain via Porkbun ─────────────────────────
  let porkbunTxId: string | undefined;

  try {
    const client = createPorkbunClient();
    const { id } = await client.registerDomain(domain, 1);
    porkbunTxId = id;
  } catch (err) {
    // If Porkbun says the domain is already registered to our account, treat
    // it as an idempotent success — we already own it from a previous attempt.
    const alreadyOwned =
      err instanceof PorkbunApiError &&
      (err.message.toLowerCase().includes('already') ||
        err.status === 'ALREADY_REGISTERED');

    if (!alreadyOwned) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error('[domain-service] Porkbun registration failed:', detail);
      await failOrder(orderId, detail);
      return { ok: false, error: `Domain registration failed: ${detail}` };
    }

    console.log(`[domain-service] Domain ${domain} already owned — treating as idempotent success`);
  }

  // ── Set DNS A record to Contabo VPS ──────────────────────────────────────
  try {
    const client = createPorkbunClient();
    const ip = getContaboIp();

    // Remove any existing A records at root to avoid conflicts.
    const existing = await client.listDnsRecords(domain);
    const rootARecords = existing.filter((r) => r.type === 'A' && r.host === '');
    await Promise.all(rootARecords.map((r) => client.deleteDnsRecord(domain, r.id)));

    // Create the new root A record.
    await client.createDnsRecord(domain, { type: 'A', host: '', content: ip, ttl: '600' });

    console.log(`[domain-service] DNS A record for ${domain} set to ${ip}`);
  } catch (err) {
    // DNS failure is non-fatal: domain is registered, just manual DNS setup needed.
    // Log prominently but don't fail the order — it can be fixed without re-purchasing.
    console.error(`[domain-service] DNS setup failed for ${domain}:`, err);
  }

  // ── Advance to building ───────────────────────────────────────────────────
  const domainInfo: DomainInfo = {
    domain,
    ...(porkbunTxId ? { porkbunTxId } : {}),
    registeredAt: new Date().toISOString(),
  };

  const completeResult = await orderStore.transition(orderId, {
    event: 'DOMAIN_PURCHASED',
    note: `Domain ${domain} registered and DNS configured`,
    meta: { domain, ...(porkbunTxId ? { porkbunTxId } : {}) },
    patch: { domain: domainInfo },
  });

  if (!completeResult.ok && completeResult.error !== 'IDEMPOTENT_SKIP') {
    return { ok: false, error: `Post-purchase transition failed: ${completeResult.detail}` };
  }

  return { ok: true, domain, path: 'purchased' };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function failOrder(orderId: string, reason: string): Promise<void> {
  await orderStore.transition(orderId, {
    event: 'DOMAIN_FAILED',
    note: reason,
  });
}
