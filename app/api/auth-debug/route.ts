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
  try {
    const { prisma } = await import('@/lib/db');
    await prisma.$queryRaw`SELECT 1`;
    dbCheck = 'ok';
  } catch (err: unknown) {
    dbCheck = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    env: authVars,
    database: dbCheck,
    timestamp: new Date().toISOString(),
  });
}
