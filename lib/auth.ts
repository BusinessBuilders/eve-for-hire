import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Nodemailer from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { prisma } from '@/lib/db';

const providers = [];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  console.log(`[auth] GitHub OAuth enabled — clientId: ${process.env.GITHUB_ID}, secret: ${process.env.GITHUB_SECRET.length} chars`);
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
} else {
  console.warn(`[auth] GitHub OAuth skipped — GITHUB_ID: ${process.env.GITHUB_ID ? 'set' : 'NOT SET'}, GITHUB_SECRET: ${process.env.GITHUB_SECRET ? 'set' : 'NOT SET'}`);
}

if (process.env.EMAIL_SERVER_HOST) {
  providers.push(
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  );
} else {
  console.warn('[auth] Email sign-in skipped — set EMAIL_SERVER_HOST to enable.');
}

if (providers.length === 0) {
  console.error('[auth] No providers configured! Set either GITHUB_ID/GITHUB_SECRET or EMAIL_SERVER_* env vars.');
}

console.log(`[auth] AUTH_SECRET: ${process.env.AUTH_SECRET ? `set (${process.env.AUTH_SECRET.length} chars)` : 'NOT SET'}`);
console.log(`[auth] DATABASE_URL: ${process.env.DATABASE_URL || 'NOT SET'}`);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: 'database' },
  trustHost: true,
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
