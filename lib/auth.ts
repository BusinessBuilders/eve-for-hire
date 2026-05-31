import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Nodemailer from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { prisma } from '@/lib/db';

const providers = [];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  console.log(`[auth] GitHub OAuth enabled — clientId: ${process.env.GITHUB_ID}`);
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
  console.log(`[auth] Email (magic link) enabled — host: ${process.env.EMAIL_SERVER_HOST}`);
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
  console.error('[auth] CRITICAL: No providers configured! Set either GITHUB_ID/GITHUB_SECRET or EMAIL_SERVER_* env vars.');
}

console.log(`[auth] AUTH_SECRET: ${process.env.AUTH_SECRET ? `set (${process.env.AUTH_SECRET.length} chars)` : 'NOT SET'}`);
console.log(`[auth] AUTH_URL: ${process.env.AUTH_URL || process.env.NEXTAUTH_URL || '(not set — relying on trustHost)'}`);
console.log(`[auth] DATABASE_URL: ${process.env.DATABASE_URL || 'NOT SET'}`);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: 'jwt' },
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});
