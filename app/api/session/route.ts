import { NextRequest, NextResponse } from 'next/server';
import { makeSessionCookie } from '../../lib/cookieHelpers';
import { getSessionUser } from '../../lib/sessionHelpers';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ loggedIn: false });
  }
  // Refresh the session cookie expiry
  const newCookie = await makeSessionCookie({ username: user.username, index: user.index });
  const res = NextResponse.json({ loggedIn: true, username: user.username, isAdmin: user.isAdmin });
  res.headers.set('Set-Cookie', newCookie);
  return res;
}
