import { prisma } from '@/lib/db';

export interface ChatSession {
  id: string;
  sessionKey: string;
  userId: string | null;
  title: string | null;
  summary: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRow {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface CreateSessionInput {
  sessionKey: string;
  userId?: string;
}

export interface CreateMessageInput {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
}

function mapSession(s: {
  id: string;
  sessionKey: string;
  userId: string | null;
  title: string | null;
  summary: string | null;
  messageCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ChatSession {
  return {
    id: s.id,
    sessionKey: s.sessionKey,
    userId: s.userId,
    title: s.title,
    summary: s.summary,
    messageCount: s.messageCount,
    lastMessageAt: s.lastMessageAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function mapMessage(m: {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: Date;
}): ChatMessageRow {
  return {
    id: m.id,
    sessionId: m.sessionId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

export interface ChatStore {
  findOrCreateSession(input: CreateSessionInput): Promise<ChatSession>;
  findBySessionKey(sessionKey: string): Promise<ChatSession | null>;
  findById(id: string): Promise<ChatSession | null>;
  listByUser(userId: string): Promise<ChatSession[]>;
  listAnonymous(sessionKeys: string[]): Promise<ChatSession[]>;
  addMessage(input: CreateMessageInput): Promise<ChatMessageRow>;
  getMessages(sessionId: string): Promise<ChatMessageRow[]>;
  updateSummary(sessionId: string, title: string, summary: string): Promise<void>;
  claimSessions(userId: string, sessionKeys: string[]): Promise<number>;
}

class PrismaChatStore implements ChatStore {
  async findOrCreateSession(input: CreateSessionInput): Promise<ChatSession> {
    const existing = await prisma.chatSession.findUnique({
      where: { sessionKey: input.sessionKey },
    });
    if (existing) return mapSession(existing);

    const created = await prisma.chatSession.create({
      data: {
        sessionKey: input.sessionKey,
        userId: input.userId ?? null,
      },
    });
    return mapSession(created);
  }

  async findBySessionKey(sessionKey: string): Promise<ChatSession | null> {
    const s = await prisma.chatSession.findUnique({ where: { sessionKey } });
    return s ? mapSession(s) : null;
  }

  async findById(id: string): Promise<ChatSession | null> {
    const s = await prisma.chatSession.findUnique({ where: { id } });
    return s ? mapSession(s) : null;
  }

  async listByUser(userId: string): Promise<ChatSession[]> {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
    });
    return sessions.map(mapSession);
  }

  async listAnonymous(sessionKeys: string[]): Promise<ChatSession[]> {
    if (sessionKeys.length === 0) return [];
    const sessions = await prisma.chatSession.findMany({
      where: { sessionKey: { in: sessionKeys }, userId: null },
      orderBy: { lastMessageAt: 'desc' },
    });
    return sessions.map(mapSession);
  }

  async addMessage(input: CreateMessageInput): Promise<ChatMessageRow> {
    const [msg, session] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          sessionId: input.sessionId,
          role: input.role,
          content: input.content,
        },
      }),
      prisma.chatSession.update({
        where: { id: input.sessionId },
        data: {
          messageCount: { increment: 1 },
          lastMessageAt: new Date(),
        },
      }),
    ]);

    // Auto-generate title from first user message
    if (input.role === 'user' && session.messageCount === 0 && !session.title) {
      const title = input.content.slice(0, 80).replace(/\n/g, ' ').trim();
      await prisma.chatSession.update({
        where: { id: input.sessionId },
        data: { title: title || 'New Chat' },
      });
    }

    return mapMessage(msg);
  }

  async getMessages(sessionId: string): Promise<ChatMessageRow[]> {
    const msgs = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return msgs.map(mapMessage);
  }

  async updateSummary(sessionId: string, title: string, summary: string): Promise<void> {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title, summary },
    });
  }

  async claimSessions(userId: string, sessionKeys: string[]): Promise<number> {
    const result = await prisma.chatSession.updateMany({
      where: { sessionKey: { in: sessionKeys }, userId: null },
      data: { userId },
    });
    return result.count;
  }
}

export const chatStore: ChatStore = new PrismaChatStore();
