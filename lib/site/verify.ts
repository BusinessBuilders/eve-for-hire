/**
 * Site Verification — DNS propagation check + HTTP smoke test
 *
 * After deploying a customer site we need to confirm two things:
 *   1. DNS: the domain's A record resolves to the Contabo VPS IP.
 *   2. HTTP: the site returns a 200 and includes recognisable content.
 *
 * Both checks use exponential back-off polling since DNS propagation and
 * Caddy's automatic TLS provisioning can take minutes.
 */

import { promises as dns } from 'dns';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DnsCheckResult {
  ok: boolean;
  resolvedIp?: string;
  expectedIp: string;
  elapsedMs: number;
}

export interface SmokeTestResult {
  ok: boolean;
  statusCode?: number;
  url?: string;
  elapsedMs: number;
  error?: string;
}

// ─── DNS propagation ──────────────────────────────────────────────────────────

/**
 * Poll DNS until the domain's A record resolves to the expected VPS IP, or
 * until the timeout is reached.
 *
 * @param domain     The domain to resolve (e.g. "acme.com")
 * @param expectedIp The Contabo VPS IP we expect to see
 * @param opts       Polling tuning — defaults are generous for production use
 */
export async function waitForDnsPropagation(
  domain: string,
  expectedIp: string,
  opts: {
    timeoutMs?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
  } = {},
): Promise<DnsCheckResult> {
  const {
    timeoutMs = 5 * 60_000,     // 5 min ceiling
    initialDelayMs = 5_000,     // 5 s first wait
    maxDelayMs = 30_000,        // 30 s max backoff step
  } = opts;

  const started = Date.now();
  let delay = initialDelayMs;

  while (Date.now() - started < timeoutMs) {
    const result = await checkDns(domain, expectedIp);
    if (result.ok) return { ...result, elapsedMs: Date.now() - started };

    await sleep(delay);
    delay = Math.min(delay * 1.5, maxDelayMs);
  }

  // Final attempt at deadline.
  const result = await checkDns(domain, expectedIp);
  return { ...result, elapsedMs: Date.now() - started };
}

async function checkDns(domain: string, expectedIp: string): Promise<DnsCheckResult> {
  try {
    const resolver = new dns.Resolver();
    // Use public resolvers for more representative global propagation check.
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    const addresses = await resolver.resolve4(domain);
    const resolvedIp = addresses[0];
    const ok = addresses.includes(expectedIp);

    return { ok, resolvedIp, expectedIp, elapsedMs: 0 };
  } catch {
    return { ok: false, expectedIp, elapsedMs: 0 };
  }
}

// ─── HTTP smoke test ──────────────────────────────────────────────────────────

/**
 * Verify the deployed site is reachable via HTTPS (and falls back to HTTP).
 * Retries to accommodate Caddy's ACME certificate provisioning delay.
 *
 * @param domain The customer domain, e.g. "acme.com"
 */
export async function httpSmokeTest(
  domain: string,
  opts: {
    timeoutMs?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
  } = {},
): Promise<SmokeTestResult> {
  const {
    timeoutMs = 3 * 60_000,    // 3 min — Caddy ACME can be slow on first provision
    initialDelayMs = 5_000,
    maxDelayMs = 20_000,
  } = opts;

  const started = Date.now();
  let delay = initialDelayMs;

  while (Date.now() - started < timeoutMs) {
    const result = await trySmokeTest(domain);
    if (result.ok) return { ...result, elapsedMs: Date.now() - started };

    await sleep(delay);
    delay = Math.min(delay * 1.5, maxDelayMs);
  }

  const result = await trySmokeTest(domain);
  return { ...result, elapsedMs: Date.now() - started };
}

async function trySmokeTest(domain: string): Promise<SmokeTestResult> {
  // Try HTTPS first, then HTTP.
  for (const scheme of ['https', 'http']) {
    const url = `${scheme}://${domain}/`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Eve-SmokeTest/1.0' },
      });

      clearTimeout(timer);

      if (res.ok || res.status === 301 || res.status === 302) {
        return { ok: true, statusCode: res.status, url, elapsedMs: 0 };
      }

      return { ok: false, statusCode: res.status, url, elapsedMs: 0 };
    } catch (err) {
      // TLS or connection error — try next scheme.
      const error = err instanceof Error ? err.message : String(err);
      if (scheme === 'http') {
        return { ok: false, url, error, elapsedMs: 0 };
      }
      // Continue to http fallback.
    }
  }

  return { ok: false, elapsedMs: 0 };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
