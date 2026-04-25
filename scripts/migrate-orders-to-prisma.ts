import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function migrate() {
  const oldDbPath = path.join(process.cwd(), 'data', 'orders.db');
  
  if (!fs.existsSync(oldDbPath)) {
    console.log('Old orders database not found at', oldDbPath);
    return;
  }

  const oldDb = new Database(oldDbPath);
  
  const rows = oldDb.prepare('SELECT * FROM orders').all() as any[];
  console.log(`Found ${rows.length} orders to migrate.`);

  for (const row of rows) {
    const data = JSON.parse(row.data);
    
    // Check if order already exists in Prisma
    const existing = await prisma.order.findUnique({
      where: { id: row.id }
    });

    if (existing) {
      console.log(`Order ${row.id} already exists in Prisma, skipping.`);
    } else {
      console.log(`Migrating order ${row.id} (${data.identifier})...`);

      await prisma.order.create({
        data: {
          id: row.id,
          identifier: data.identifier,
          seq: parseInt(data.identifier.split('-')[1]),
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          state: row.state,
          idempotencyKey: row.idempotency_key,
          requirements: data.requirements ? JSON.stringify(data.requirements) : null,
          payment: data.payment ? JSON.stringify(data.payment) : null,
          domain: data.domain ? JSON.stringify(data.domain) : null,
          deploy: data.deploy ? JSON.stringify(data.deploy) : null,
          auditTrail: JSON.stringify(data.auditTrail || []),
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }
      });
    }
  }

  // Migrate analytics
  const analyticsRows = oldDb.prepare('SELECT * FROM analytics_events').all() as any[];
  console.log(`Found ${analyticsRows.length} analytics events to migrate.`);
  
  for (const row of analyticsRows) {
    const existing = await prisma.analyticsEvent.findUnique({
      where: { id: row.id }
    });
    if (existing) continue;

    await prisma.analyticsEvent.create({
      data: {
        id: row.id,
        event: row.event,
        sessionId: row.session_id,
        orderId: row.order_id,
        domain: row.domain,
        email: row.email,
        props: row.props,
        ts: new Date(row.ts)
      }
    });
  }

  console.log('Migration completed.');
  await prisma.$disconnect();
}

migrate().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
