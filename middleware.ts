
import { NextRequest, NextResponse } from 'next/server';
import { getSessionLight } from './app/lib/getSessionLight';

const PUBLIC_PATHS = ['/login', '/register', '/logout', '/api/login', '/api/register', '/api/logout', '/api/session', '/api/registration-open'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/' || PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = await getSessionLight(req);
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  // User is authenticated (valid JWT session)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
