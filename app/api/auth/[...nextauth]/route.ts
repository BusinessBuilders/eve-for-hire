import { handlers } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Debug wrapper: catch the real error behind NextAuth's generic "Configuration" response
async function debugWrapper(req: NextRequest, handler: (req: NextRequest) => Promise<Response>): Promise<Response> {
  try {
    const res = await handler(req);
    // If redirected to error page, capture what we can
    const location = res.headers.get('location');
    if (location?.includes('error=Configuration')) {
      console.error('[auth-debug] Configuration error redirect detected:', location);
    }
    return res;
  } catch (err) {
    console.error('[auth-debug] Unhandled error in auth handler:', err);
    throw err;
  }
}

export async function GET(req: NextRequest) {
  return debugWrapper(req, handlers.GET);
}

export async function POST(req: NextRequest) {
  return debugWrapper(req, handlers.POST);
}
