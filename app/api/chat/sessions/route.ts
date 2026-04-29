import { NextResponse } from 'next/server';
import { chatStore, type ChatSession } from '@/lib/chat/store';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();

  try {
    let sessions: ChatSession[];

    if (session?.user?.id) {
      sessions = await chatStore.listByUser(session.user.id);
    } else {
      sessions = [];
    }

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('[chat/sessions] list error:', err);
    return NextResponse.json({ sessions: [] });
  }
}
