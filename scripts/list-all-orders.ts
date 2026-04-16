import { orderStore } from '../lib/order/store';

async function main() {
  const orders = await orderStore.list();
  console.log(JSON.stringify(orders.map(o => ({
    id: o.id,
    identifier: o.identifier,
    state: o.state,
    domain: o.domain?.domain,
    customerName: o.customerName,
    updatedAt: o.updatedAt,
    auditTrail: o.auditTrail
  })), null, 2));
}

main().catch(console.error);
