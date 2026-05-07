import { NextResponse } from 'next/server';
import { chatStore } from '@/lib/chat/store';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let sessionKeys: string[];
  try {
    const body = await req.json();
    sessionKeys = body.sessionKeys;
    if (!Array.isArray(sessionKeys)) throw new Error();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request: expected { sessionKeys: string[] }' },
      { status: 400 },
    );
  }

  const claimed = await chatStore.claimSessions(session.user.id, sessionKeys);
  return NextResponse.json({ claimed });
}
