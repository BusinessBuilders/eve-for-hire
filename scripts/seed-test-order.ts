import { orderStore } from '../lib/order/store';

async function main() {
  const email = 'test@example.com';
  const name = 'Test Customer';
  const idempotencyKey = `test-${Date.now()}`;

  console.log('Creating test order...');
  const order = await orderStore.create({
    customerEmail: email,
    customerName: name,
    idempotencyKey,
  });

  console.log(`Order created: ${order.id} (${order.identifier})`);

  // Transition to qualifying
  await orderStore.transition(order.id, {
    event: 'START_QUALIFYING',
    note: 'Seeding test order',
  });

  // Transition to payment_pending with requirements
  await orderStore.transition(order.id, {
    event: 'REQUIREMENTS_READY',
    patch: {
      requirements: {
        businessType: 'Plumbing',
        purpose: 'Local plumbing services in Austin, TX',
        desiredDomain: 'mikes-plumbing-austin.com',
        chatSummary: 'Mike wants a simple 4-page site for his plumbing business. He wants to highlight his 24/7 emergency service.',
        style: 'Professional and trustworthy, blue and white colors.',
      },
    },
  });

  // Transition to paid
  await orderStore.transition(order.id, {
    event: 'PAYMENT_SUCCEEDED',
    patch: {
        payment: {
            stripeSessionId: 'test_session_123',
            amountCents: 4900,
            paidAt: new Date().toISOString()
        },
        domain: {
            domain: 'mikes-plumbing-austin.com'
        }
    }
  });

  console.log(`Order ${order.id} is now PAID and ready for build swarm.`);
}

main().catch(console.error);
