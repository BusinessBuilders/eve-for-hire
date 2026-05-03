import { NextResponse } from 'next/server';
import { Auth, raw } from '@auth/core';
import GitHub from '@auth/core/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Directly test the NextAuth OAuth initiation to capture the ACTUAL error
export async function GET() {
  const providers = [];

  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push(
      GitHub({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      }),
    );
  }

  const config = {
    adapter: PrismaAdapter(prisma),
    providers,
    session: { strategy: 'jwt' as const },
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    basePath: '/api/auth',
    raw,
    logger: {
      error(code: unknown, ...args: unknown[]) {
        console.error('[oauth-test][next-auth error]', code, ...args);
      },
      warn(code: unknown, ...args: unknown[]) {
        console.warn('[oauth-test][next-auth warn]', code, ...args);
      },
      debug(code: unknown, ...args: unknown[]) {
        console.log('[oauth-test][next-auth debug]', code, ...args);
      },
    },
  };

  try {
    const url = new URL('https://eve.center/api/auth/signin/github');
    const req = new Request(url.toString(), {
      headers: {
        'x-forwarded-proto': 'https',
        host: 'eve.center',
      },
    });

    const result = await Auth(req, config);

    return NextResponse.json({
      status: result.status,
      ok: result.ok,
      redirected: result.redirected,
      location: result.headers.get('location'),
      cookies: result.headers.getSetCookie()?.length ?? 0,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      error: true,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 10) : undefined,
      name: (err as { name?: string })?.name,
      type: (err as { type?: string })?.type,
    }, { status: 500 });
  }
}
