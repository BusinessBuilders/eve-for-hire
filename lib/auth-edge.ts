import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

const providers = [];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

export const { auth } = NextAuth({
  providers,
  pages: {
    signIn: '/chat',
  },
  trustHost: true,
});
