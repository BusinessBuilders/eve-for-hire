/**
 * Build & Deploy Service
 *
 * Orchestrates the full site-build pipeline for a single order:
 *
 *   building → (AI content gen + HTML render + SSH deploy + Caddy reload)
 *           → deploying → (DNS check + HTTP smoke test)
 *           → live
 *
 * Failure states:
 *   building  → build_failed   (content gen or SSH deploy failed)
 *   deploying → deploy_failed  (DNS never propagated or smoke test failed)
 *
 * Each phase updates the order state machine before executing, so a crashed
 * process can be safely retried without double-billing or double-deploying.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY       — for AI content generation
 *   CONTABO_VPS_IP          — VPS hostname/IP for SSH and DNS check
 *   CONTABO_SSH_USER        — SSH username (default: root)
 *   CONTABO_SSH_PRIVATE_KEY — PEM or base64 SSH private key
 */

import { orderStore } from '@/lib/order/store';
import { generateSiteContent } from './content-generator';
import { renderSiteHtml } from './template';
import {
  openSshSession,
  assertValidDomain,
} from './ssh';
import {
  generateSiteCaddyConfig,
  remoteSiteConfigPath,
  remoteSiteRootPath,
  bootstrapCommands,
} from './caddy';
import { waitForDnsPropagation, httpSmokeTest } from './verify';
import type { DeployInfo } from '@/lib/order/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuildResult =
  | { ok: true; siteUrl: string }
  | { ok: false; phase: 'build' | 'deploy'; error: string };

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Build and deploy the website for a given order.
 *
 * Must be called when the order is in the 'building' state.
 * Handles all state transitions internally.
 *
 * This function is idempotent — if the order is already 'deploying' or 'live',
 * it returns successfully without re-running the build.
 */
export async function buildAndDeployOrder(orderId: string): Promise<BuildResult> {
  const order = await orderStore.findById(orderId);
  if (!order) return { ok: false, phase: 'build', error: `Order ${orderId} not found` };

  // Idempotency — already past building.
  if (order.state === 'deploying' || order.state === 'live') {
    const url = order.deploy?.siteUrl ?? `https://${order.domain?.domain}`;
    return { ok: true, siteUrl: url };
  }

  if (order.state !== 'building') {
    return {
      ok: false,
      phase: 'build',
      error: `Order is in '${order.state}' — build requires 'building' state`,
    };
  }

  const requirements = order.requirements;
  if (!requirements) {
    await failBuild(orderId, 'Order has no requirements — cannot generate content');
    return { ok: false, phase: 'build', error: 'Missing requirements' };
  }

  const domain = order.domain?.domain;
  if (!domain) {
    await failBuild(orderId, 'Order has no domain — cannot deploy');
    return { ok: false, phase: 'build', error: 'Missing domain' };
  }

  try {
    assertValidDomain(domain);
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await failBuild(orderId, err);
    return { ok: false, phase: 'build', error: err };
  }

  const vpsIp = process.env.CONTABO_VPS_IP;
  if (!vpsIp) {
    await failBuild(orderId, 'CONTABO_VPS_IP is not set — cannot deploy');
    return { ok: false, phase: 'build', error: 'CONTABO_VPS_IP not configured' };
  }

  // ── Phase 1: Generate content ───────────────────────────────────────────────
  console.log(`[build-service] generating content for order ${orderId} domain=${domain}`);
  let html: string;
  try {
    const content = await generateSiteContent(requirements);
    html = renderSiteHtml(content, domain);
    console.log(`[build-service] content generated for ${domain} (${html.length} bytes)`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[build-service] content generation failed for ${orderId}:`, detail);
    await failBuild(orderId, `Content generation failed: ${detail}`);
    return { ok: false, phase: 'build', error: detail };
  }

  // ── Phase 2: Deploy to VPS via SSH ──────────────────────────────────────────
  console.log(`[build-service] deploying ${domain} to VPS`);
  let session;
  try {
    session = await openSshSession();

    // Bootstrap Caddy directory structure (idempotent).
    for (const cmd of bootstrapCommands()) {
      await session.runRemoteCommand(cmd);
    }

    // Create site root directory.
    const siteRoot = remoteSiteRootPath(domain);
    await session.runRemoteCommand(`mkdir -p "${siteRoot}"`);

    // Upload the generated HTML.
    await session.uploadFile(`${siteRoot}/index.html`, html);

    // Write the per-site Caddy config.
    const caddyConfig = generateSiteCaddyConfig(domain);
    await session.uploadFile(remoteSiteConfigPath(domain), caddyConfig);

    // Reload Caddy to pick up the new virtual host.
    await session.runRemoteCommand('caddy reload --config /etc/caddy/Caddyfile');

    console.log(`[build-service] VPS deploy complete for ${domain}`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[build-service] SSH deploy failed for ${orderId}:`, detail);
    await failBuild(orderId, `SSH deploy failed: ${detail}`);
    return { ok: false, phase: 'build', error: detail };
  } finally {
    session?.close();
  }

  // ── Transition to deploying ─────────────────────────────────────────────────
  const deployResult = await orderStore.transition(orderId, {
    event: 'BUILD_SUCCEEDED',
    note: `Site built and uploaded to VPS for ${domain}`,
    meta: { domain },
  });

  if (!deployResult.ok && deployResult.error !== 'IDEMPOTENT_SKIP') {
    console.error(`[build-service] BUILD_SUCCEEDED transition failed:`, deployResult.detail);
    return { ok: false, phase: 'build', error: deployResult.detail };
  }

  console.log(`[build-service] order ${orderId} → deploying`);

  // ── Phase 3: Wait for DNS + smoke test ──────────────────────────────────────
  console.log(`[build-service] waiting for DNS propagation for ${domain} → ${vpsIp}`);
  const dnsResult = await waitForDnsPropagation(domain, vpsIp, {
    timeoutMs: 5 * 60_000,
  });

  if (!dnsResult.ok) {
    const msg = `DNS for ${domain} did not resolve to ${vpsIp} within 5 minutes (got: ${dnsResult.resolvedIp ?? 'no record'})`;
    console.warn(`[build-service] ${msg}`);
    await failDeploy(orderId, msg);
    return { ok: false, phase: 'deploy', error: msg };
  }

  console.log(`[build-service] DNS ok for ${domain} (${dnsResult.elapsedMs}ms)`);

  console.log(`[build-service] running smoke test for ${domain}`);
  const smokeResult = await httpSmokeTest(domain, { timeoutMs: 3 * 60_000 });

  if (!smokeResult.ok) {
    const msg = smokeResult.error
      ? `Smoke test failed: ${smokeResult.error}`
      : `Smoke test returned HTTP ${smokeResult.statusCode ?? 'no response'} for ${smokeResult.url ?? domain}`;
    console.warn(`[build-service] ${msg}`);
    await failDeploy(orderId, msg);
    return { ok: false, phase: 'deploy', error: msg };
  }

  console.log(`[build-service] smoke test ok for ${domain} (${smokeResult.statusCode} ${smokeResult.url})`);

  // ── Transition to live ──────────────────────────────────────────────────────
  const siteUrl = smokeResult.url ?? `https://${domain}`;
  const deployInfo: DeployInfo = {
    siteUrl,
    liveAt: new Date().toISOString(),
  };

  const liveResult = await orderStore.transition(orderId, {
    event: 'DEPLOY_SUCCEEDED',
    note: `Site live at ${siteUrl}`,
    meta: { siteUrl, dnsElapsedMs: String(dnsResult.elapsedMs) },
    patch: { deploy: deployInfo },
  });

  if (!liveResult.ok && liveResult.error !== 'IDEMPOTENT_SKIP') {
    console.error(`[build-service] DEPLOY_SUCCEEDED transition failed:`, liveResult.detail);
    return { ok: false, phase: 'deploy', error: liveResult.detail };
  }

  console.log(`[build-service] order ${orderId} → live at ${siteUrl}`);
  return { ok: true, siteUrl };
}

// ─── Failure helpers ──────────────────────────────────────────────────────────

async function failBuild(orderId: string, reason: string): Promise<void> {
  await orderStore.transition(orderId, {
    event: 'BUILD_FAILED',
    note: reason,
  });
}

async function failDeploy(orderId: string, reason: string): Promise<void> {
  await orderStore.transition(orderId, {
    event: 'DEPLOY_FAILED',
    note: reason,
  });
}
