import { NextRequest, NextResponse } from 'next/server';
import { getUserStore } from '@/lib/userStoreSingleton';
import { makeSessionCookie } from '../../lib/cookieHelpers';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json() as { username: string; password: string };
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const userStore = getUserStore();
  if (!userStore.authenticate(username, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  const cookie = await makeSessionCookie({ username, index: userStore.getUser(username)?.index });
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', cookie);
  return res;
}
