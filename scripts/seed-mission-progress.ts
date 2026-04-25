import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('STRIPE_SECRET_KEY not set');
    process.exit(1);
  }

  const stripe = new Stripe(key, { apiVersion: '2023-10-16' });

  console.log('Fetching all historical charges to seed MissionProgress...');
  
  let totalCents = 0;
  try {
    // We use charges.list with auto-pagination here ONCE to seed the DB.
    // This is O(N) but only runs during seeding.
    for await (const charge of stripe.charges.list({ limit: 100 })) {
      if (charge.paid && !charge.refunded) {
        totalCents += charge.amount;
      }
    }
    
    console.log(`Total cents calculated: ${totalCents}`);

    await prisma.missionProgress.upsert({
      where: { id: 'current' },
      update: { totalRaised: totalCents },
      create: { id: 'current', totalRaised: totalCents },
    });

    console.log('MissionProgress seeded successfully');
  } catch (err) {
    console.error('Failed to seed MissionProgress:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
