import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-edge';

const PROTECTED_ROUTE_PATTERNS = ['/dashboard'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTE_PATTERNS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = '/chat';
    url.searchParams.set('signIn', '1');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
