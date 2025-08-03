
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/logout', '/api/login', '/api/register', '/api/logout'];

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

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    if (pathname.startsWith('/logout')) {
      // Always allow /logout to be visited
      return NextResponse.next();
    }
    if(pathname.startsWith('/api/')) {
      // Allow API routes to be accessed without authentication
      return NextResponse.next();
    }
    // If the user is already authenticated, redirect to /syncthing page
    if (username) {
      return NextResponse.redirect(new URL('/syncthing', req.url));
    }
    return NextResponse.next();
  }
  if (!username) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  // User is authenticated (cookie present)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api/proxy-syncthing).*)'],
};
