import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authVars = {
    AUTH_SECRET: process.env.AUTH_SECRET ? `set (${process.env.AUTH_SECRET.length} chars)` : 'NOT SET',
    GITHUB_ID: process.env.GITHUB_ID || 'NOT SET',
    GITHUB_SECRET: process.env.GITHUB_SECRET ? `set (${process.env.GITHUB_SECRET.length} chars)` : 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  };

  let dbCheck = 'not tested';
  let tables: string[] = [];
  let adapterCheck = 'not tested';
  try {
    const { prisma } = await import('@/lib/db');
    await prisma.$queryRaw`SELECT 1`;
    dbCheck = 'ok';

    // Check if auth tables exist
    try {
      const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`;
      tables = (result as { name: string }[]).map((r) => r.name);
    } catch (e: unknown) {
      tables = [`error: ${e instanceof Error ? e.message : String(e)}`];
    }

    // Check if PrismaAdapter can be constructed
    try {
      const { PrismaAdapter } = await import('@auth/prisma-adapter');
      const adapter = PrismaAdapter(prisma);
      adapterCheck = adapter ? 'ok' : 'null';
    } catch (e: unknown) {
      adapterCheck = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  } catch (err: unknown) {
    dbCheck = err instanceof Error ? err.message : String(err);
  }

  // Try to simulate what NextAuth does during OAuth initiation
  let oauthUrlCheck = 'not tested';
  try {
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', process.env.GITHUB_ID || '');
    authUrl.searchParams.set('scope', 'read:user,user:email');
    oauthUrlCheck = `ok (would redirect to github.com, url length: ${authUrl.toString().length})`;
  } catch (e: unknown) {
    oauthUrlCheck = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    env: authVars,
    database: dbCheck,
    tables,
    adapter: adapterCheck,
    oauthUrl: oauthUrlCheck,
    timestamp: new Date().toISOString(),
  });
}
