import { prisma } from '@/lib/db';

const FREE_MESSAGE_LIMIT = Number(process.env.FREE_MESSAGE_LIMIT) || 10;

export function getFreeMessageLimit(): number {
  return FREE_MESSAGE_LIMIT;
}

/**
 * Count total user messages across all sessions for an authenticated user.
 * Returns -1 for paid users (no limit).
 */
export async function getUserMessageCount(userId: string): Promise<{ used: number; limit: number }> {
  const hasPaid = await hasActiveSubscription(userId);

  if (hasPaid) {
    return { used: 0, limit: -1 };
  }

  const result = await prisma.chatMessage.aggregate({
    _count: true,
    where: {
      role: 'user',
      session: { userId },
    },
  });

  return { used: result._count, limit: FREE_MESSAGE_LIMIT };
}

/**
 * Count user messages for an anonymous session.
 */
export async function getAnonymousMessageCount(sessionKey: string): Promise<{ used: number; limit: number }> {
  const result = await prisma.chatMessage.aggregate({
    _count: true,
    where: {
      role: 'user',
      session: { sessionKey },
    },
  });

  return { used: result._count, limit: FREE_MESSAGE_LIMIT };
}

/**
 * Check if a user has an active paid subscription (completed order).
 */
async function hasActiveSubscription(userId: string): Promise<boolean> {
  const paidOrder = await prisma.order.findFirst({
    where: {
      userId,
      state: { in: ['live', 'deploying', 'building'] },
    },
  });
  return !!paidOrder;
}
