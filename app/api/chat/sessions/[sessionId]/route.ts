import { NextResponse } from 'next/server';
import { chatStore } from '@/lib/chat/store';
import { auth } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = await auth();

  try {
    const chatSession = await chatStore.findById(sessionId);
    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Access control: owner or same session key
    if (chatSession.userId && chatSession.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await chatStore.getMessages(sessionId);
    return NextResponse.json({ session: chatSession, messages });
  } catch (err) {
    console.error('[chat/sessions/:id] get error:', err);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}
