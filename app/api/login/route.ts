import { NextRequest, NextResponse } from 'next/server';
import { UserStore } from '../../lib/userStore';
import { makeSessionCookie } from '../../lib/cookieHelpers';

const store = new UserStore();

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }
  if (!store.authenticate(username, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  // Set a simple session cookie (username, not secure for production)
  const cookie = makeSessionCookie(username);
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', cookie);
  return res;
}
