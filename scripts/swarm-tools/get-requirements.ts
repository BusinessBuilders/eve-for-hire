import { orderStore } from '../../lib/order/store';

async function main() {
  const [orderId] = process.argv.slice(2);
  if (!orderId) {
    console.error('Usage: tsx get-requirements.ts <orderId>');
    process.exit(1);
  }

  const order = await orderStore.findById(orderId);
  if (!order) {
    console.error(`Order ${orderId} not found`);
    process.exit(1);
  }

  console.log(JSON.stringify(order.requirements, null, 2));
}

main().catch(console.error);
