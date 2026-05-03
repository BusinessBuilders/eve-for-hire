import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

export const { auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),
  ],
  pages: {
    signIn: '/chat',
  },
  trustHost: true,
});
