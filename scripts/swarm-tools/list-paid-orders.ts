import { orderStore } from '../../lib/order/store';

async function main() {
  const orders = await orderStore.list();
  const paidOrders = orders.filter(o => o.state === 'paid');
  
  if (paidOrders.length === 0) {
    console.log('No paid orders pending build.');
    return;
  }

  console.log(JSON.stringify(paidOrders.map(o => ({
    id: o.id,
    identifier: o.identifier,
    domain: o.domain?.domain,
    customerName: o.customerName
  })), null, 2));
}

main().catch(console.error);
