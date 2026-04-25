import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Nodemailer from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { prisma } from '@/lib/db';

const githubClientId = process.env.GITHUB_ID;
const githubClientSecret = process.env.GITHUB_SECRET;

if (!githubClientId || !githubClientSecret) {
  console.warn('[auth] GitHub OAuth env vars are missing. Set GITHUB_ID and GITHUB_SECRET.');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: githubClientId ?? '',
      clientSecret: githubClientSecret ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: { strategy: 'database' },
  pages: {
    signIn: '/chat',
  },
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
