import { orderStore } from '../../lib/order/store';

async function main() {
  const [orderId, event, note] = process.argv.slice(2);
  if (!orderId || !event) {
    console.error('Usage: tsx update-order-state.ts <orderId> <event> [note]');
    process.exit(1);
  }

  const result = await orderStore.transition(orderId, {
    event: event as any,
    note: note || undefined,
  });

  if (result.ok || result.error === 'IDEMPOTENT_SKIP') {
    console.log(`✅ Order ${orderId} transitioned: ${event}`);
  } else {
    console.error(`❌ Transition failed: ${result.detail}`);
    process.exit(1);
  }
}

main().catch(console.error);
