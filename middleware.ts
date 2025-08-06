
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/logout', '/api/login', '/api/register', '/api/logout', '/api/session', '/api/registration-open'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  const cookie = req.headers.get('cookie');
  let username = '';
  if (cookie) {
    const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('session='));
    if (match) {
      username = decodeURIComponent(match.split('=')[1]);
    }
  }

  if (pathname === '/' || PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (!username) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  // User is authenticated (cookie present)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
