import { prisma } from '@/lib/db';

interface CreateDraftData {
  token: string;
  sessionId: string;
  businessName: string;
  tagline?: string;
  category?: string;
  primaryColor?: string;
  heroHtml: string;
  expiresAt: Date;
}

export async function createDraft(data: CreateDraftData) {
  return prisma.draftPreview.create({ data });
}

export async function getDraftByToken(token: string) {
  const draft = await prisma.draftPreview.findUnique({ where: { token } });
  if (!draft) throw new Error('Draft not found');
  if (draft.expiresAt < new Date()) throw new Error('Draft expired');
  return draft;
}

export async function incrementViewCount(token: string) {
  return prisma.draftPreview.update({
    where: { token },
    data: { viewCount: { increment: 1 } },
  });
}

export async function markCtaClicked(token: string) {
  return prisma.draftPreview.update({
    where: { token },
    data: { ctaClicked: true },
  });
}
