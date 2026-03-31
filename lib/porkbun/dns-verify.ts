/**
 * DNS verification utilities for customer-owned domain flow.
 *
 * Used by POST /api/domains/verify to check whether a customer has updated
 * their DNS A record to point at Eve's Contabo VPS before we advance the
 * order from 'domain_purchasing' → 'building'.
 *
 * We use the OS DNS resolver (Node.js dns.promises) rather than Porkbun's API
 * because we need to observe what the *public internet* resolves — not what
 * Porkbun holds internally. Only a successful public resolution confirms the
 * customer's DNS change has propagated.
 */

import { promises as dnsPromises } from 'dns';
import { orderStore } from '@/lib/order/store';
import type { DomainInfo } from '@/lib/order/types';

// ─── DNS check ───────────────────────────────────────────────────────────────

export interface DnsCheckResult {
  domain: string;
  resolvedIps: string[];
  expectedIp: string;
  verified: boolean;
}

/**
 * Resolve the A records for a domain and compare against the expected IP.
 * Returns the full set of resolved IPs plus a boolean indicating match.
 *
 * Failures (NXDOMAIN, NODATA, timeout) are returned as `verified: false`
 * with an empty `resolvedIps` array rather than thrown — DNS errors are
 * expected while propagation is still in flight.
 */
export async function checkDnsARecord(domain: string, expectedIp: string): Promise<DnsCheckResult> {
  let resolvedIps: string[] = [];

  try {
    resolvedIps = await dnsPromises.resolve4(domain);
  } catch {
    // ENOTFOUND, ENODATA, ETIMEOUT, etc. — propagation not yet complete.
  }

  return {
    domain,
    resolvedIps,
    expectedIp,
    verified: resolvedIps.includes(expectedIp),
  };
}

// ─── Order advancement ───────────────────────────────────────────────────────

export type DnsVerifyResult =
  | { verified: true; domain: string; resolvedIps: string[] }
  | { verified: false; domain: string; resolvedIps: string[]; reason: string }
  | { verified: false; domain: string; resolvedIps: []; reason: string };

/**
 * Check DNS propagation for an order's existing domain and — if the A record
 * resolves to CONTABO_VPS_IP — advance the order from 'domain_purchasing' to
 * 'building' by firing DOMAIN_PURCHASED.
 *
 * Safe to call repeatedly: if DNS hasn't propagated, order stays in
 * 'domain_purchasing' with no state change. If already in 'building' or
 * beyond, returns verified=true immediately (idempotent).
 */
export async function advanceDomainIfDnsReady(orderId: string): Promise<DnsVerifyResult> {
  const expectedIp = process.env.CONTABO_VPS_IP;
  if (!expectedIp) {
    return { verified: false, domain: '', resolvedIps: [], reason: 'CONTABO_VPS_IP not configured' };
  }

  const order = await orderStore.findById(orderId);
  if (!order) {
    return { verified: false, domain: '', resolvedIps: [], reason: `Order ${orderId} not found` };
  }

  const domain = order.requirements?.desiredDomain?.trim().toLowerCase() ?? '';
  if (!domain) {
    return { verified: false, domain: '', resolvedIps: [], reason: 'No domain on order requirements' };
  }

  // Idempotent: if already past domain_purchasing, DNS was already verified.
  if (['building', 'deploying', 'live'].includes(order.state)) {
    return { verified: true, domain, resolvedIps: [expectedIp] };
  }

  if (order.state !== 'domain_purchasing') {
    return {
      verified: false,
      domain,
      resolvedIps: [],
      reason: `Order is in '${order.state}' — expected 'domain_purchasing'`,
    };
  }

  // Run the DNS check.
  const check = await checkDnsARecord(domain, expectedIp);

  if (!check.verified) {
    console.log(
      `[dns-verify] ${domain} A records: [${check.resolvedIps.join(', ') || 'none'}] — expected ${expectedIp}, not propagated yet`,
    );
    return {
      verified: false,
      domain,
      resolvedIps: check.resolvedIps,
      reason: check.resolvedIps.length === 0
        ? 'Domain does not resolve yet — DNS may not be set or not propagated'
        : `A records point to [${check.resolvedIps.join(', ')}], expected ${expectedIp}`,
    };
  }

  // DNS verified — store domain info and advance to building.
  const domainInfo: DomainInfo = {
    domain,
    registeredAt: new Date().toISOString(),
  };

  const result = await orderStore.transition(orderId, {
    event: 'DOMAIN_PURCHASED',
    note: `DNS verified — ${domain} A record resolves to ${expectedIp}`,
    meta: { domain, verifiedIp: expectedIp },
    patch: { domain: domainInfo },
  });

  if (!result.ok && result.error !== 'IDEMPOTENT_SKIP') {
    console.error('[dns-verify] DOMAIN_PURCHASED transition failed:', result.error, result.detail);
    return {
      verified: false,
      domain,
      resolvedIps: check.resolvedIps,
      reason: `State transition failed: ${result.detail}`,
    };
  }

  console.log(`[dns-verify] ${domain} verified → order ${orderId} advanced to building`);
  return { verified: true, domain, resolvedIps: check.resolvedIps };
}
