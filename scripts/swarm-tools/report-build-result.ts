/**
 * CLI Tool: Report Swarm Build Result
 * 
 * Usage: npx tsx report-build-result.ts <orderId> <state> <siteUrl> [error]
 * 
 * Env vars:
 * - PAPERCLIP_CALLBACK_SECRET: Shared secret for auth
 * - NEXT_PUBLIC_BASE_URL: Base URL of the app
 */

async function main() {
  const [orderId, state, siteUrl, error] = process.argv.slice(2);
  if (!orderId || !state) {
    console.error('Usage: npx tsx report-build-result.ts <orderId> <state> <siteUrl> [error]');
    process.exit(1);
  }

  const secret = process.env.PAPERCLIP_CALLBACK_SECRET;
  if (!secret) {
    console.error('PAPERCLIP_CALLBACK_SECRET is not set');
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/orders/${orderId}/build-result`;

  console.log(`[swarm-tool] reporting ${state} for order ${orderId} to ${url}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, siteUrl, error, secret }),
    });

    if (res.ok) {
      console.log('✅ Result reported successfully');
    } else {
      const text = await res.text();
      console.error(`❌ Failed to report result: ${res.status} ${text}`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Error reporting result: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
