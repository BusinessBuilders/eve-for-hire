import { waitForDnsPropagation, httpSmokeTest } from '../../lib/site/verify';

async function main() {
  const [domain] = process.argv.slice(2);

  if (!domain) {
    console.error('Usage: tsx verify-site.ts <domain>');
    process.exit(1);
  }

  const vpsIp = process.env.CONTABO_VPS_IP;
  if (!vpsIp) {
    console.error('CONTABO_VPS_IP not set — cannot verify DNS');
    process.exit(1);
  }


  console.log(`[swarm-tool] verifying DNS for ${domain} → ${vpsIp}`);
  const dnsResult = await waitForDnsPropagation(domain, vpsIp, { timeoutMs: 2 * 60_000 });

  if (!dnsResult.ok) {
    console.error(`[swarm-tool] DNS verification failed: ${dnsResult.resolvedIp || 'no record'}`);
    process.exit(1);
  }

  console.log(`[swarm-tool] DNS ok, running smoke test for ${domain}`);
  const smokeResult = await httpSmokeTest(domain, { timeoutMs: 1 * 60_000 });

  if (!smokeResult.ok) {
    console.error(`[swarm-tool] Smoke test failed: ${smokeResult.error || 'unknown error'}`);
    process.exit(1);
  }

  console.log(`[swarm-tool] PASS: ${smokeResult.url}`);
}

main().catch(console.error);
