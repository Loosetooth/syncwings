import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '../../../cookieHelpers';

export async function POST() {
  // Clear the session cookie
  const cookie = clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', cookie);
  return res;
}
